import { Queue, Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { redis, config } from './config';
import { sendEmail } from './mailer';
import { indexEmail } from './search';

const prisma = new PrismaClient();
export const emailQueue = new Queue('emails', { connection: redis });

export const worker = new Worker(
  'emails',
  async (job) => {
    const { id } = job.data;
    const email = await prisma.emailJob.findUnique({ where: { id }, include: { sender: true } });

    if (!email || email.status === 'SENT') return; // Idempotency check

    // 1. Atomic Redis Hourly Rate Limiter (sliding 1-hour window)
    const rateKey = `rate:${email.senderId}`;
    const now = Date.now();
    const count = await redis.zcount(rateKey, now - 3600000, now);

    if (count >= email.sender.hourlyLimit) {
      const delayMs = 3600000; // Reschedule to next hour window
      const nextTime = new Date(now + delayMs);

      await emailQueue.add('send', { id }, { delay: delayMs });
      await prisma.emailJob.update({ where: { id }, data: { status: 'RESCHEDULED', scheduledAt: nextTime } });

      // Live Slack alert on rate limit hit (as required)
      const slack = await prisma.slackIntegration.findUnique({ where: { userId: email.userId } });
      if (slack?.incomingWebhook) {
        try {
          await axios.post(slack.incomingWebhook, {
            text: `🚨 *Rate limit reached* for ${email.sender.email} (${email.sender.hourlyLimit}/hr). Email rescheduled to ${nextTime.toLocaleTimeString()}.`,
          });
        } catch (e: any) {
          console.warn('[Slack Webhook Error]', e.message);
        }
      }
      return;
    }

    // 2. Throttle delay between individual sends
    await new Promise((r) => setTimeout(r, (email.sender.minDelaySeconds || 2) * 1000));

    // 3. Send fake email via Ethereal SMTP
    const { previewUrl } = await sendEmail({
      user: email.sender.etherealUser,
      pass: email.sender.etherealPass,
      from: email.sender.email,
      to: email.recipientEmail,
      subject: email.subject,
      body: email.body,
    });
    console.log(`[SMTP] Sent to ${email.recipientEmail} | Preview: ${previewUrl}`);

    // 4. Update DB, Redis Rate window, and Elasticsearch
    await redis.zadd(rateKey, now, `${now}-${Math.random()}`);
    await redis.expire(rateKey, 3600);

    const sentAt = new Date();
    await prisma.emailJob.update({ where: { id }, data: { status: 'SENT', sentAt } });
    await indexEmail({ ...email, status: 'SENT', sentAt });
  },
  { connection: redis, concurrency: config.concurrency }
);

worker.on('error', (err) => {
  console.error('[BullMQ Worker Error]:', err.message);
});
