import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import nodemailer from 'nodemailer';
import { config } from './config';
import { emailQueue } from './queue';
import { initES, indexEmail, searchEmails } from './search';

const app = express();
const prisma = new PrismaClient();
app.use(cors());
app.use(express.json());

// Bull-Board UI mounted at /admin/queues
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');
createBullBoard({ queues: [new BullMQAdapter(emailQueue)], serverAdapter });
app.use('/admin/queues', serverAdapter.getRouter());

// Google Login (Upserts user + provisions Ethereal SMTP credentials)
app.post('/api/auth/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'Missing credential token' });
    }
    const payload = JSON.parse(Buffer.from(credential.split('.')[1], 'base64').toString());

    const user = await prisma.user.upsert({
      where: { email: payload.email },
      update: { name: payload.name, avatar: payload.picture },
      create: { email: payload.email, name: payload.name, avatar: payload.picture, googleId: payload.sub },
    });

    let sender = await prisma.sender.findFirst({ where: { userId: user.id } });
    if (!sender) {
      const testAcc = await nodemailer.createTestAccount();
      sender = await prisma.sender.create({
        data: {
          userId: user.id,
          email: testAcc.user,
          name: user.name || 'Outreach',
          etherealUser: testAcc.user,
          etherealPass: testAcc.pass,
        },
      });
    }
    res.json({ user });
  } catch (err: any) {
    console.error('Google auth error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Schedule Batch API (Self-healing: guarantees User & Sender exist in DB)
app.post('/api/emails/schedule', async (req, res) => {
  try {
    const { userId, subject, body, recipients, scheduledStartTime, delayBetweenEmailsSec, hourlyLimit } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: 'Recipients list is empty.' });
    }

    // 1. Safely resolve or create the User in DB
    let user = null;
    if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId } }).catch(() => null);
    }
    if (!user) {
      user = await prisma.user.findFirst();
    }
    if (!user) {
      // Create user record so foreign key constraint never fails
      user = await prisma.user.create({
        data: {
          email: 'prattub7@gmail.com',
          name: 'Pratyasha Basak',
          googleId: `google-user-${Date.now()}`,
        },
      });
    }

    // 2. Safely resolve or create Sender attached to this valid User
    let sender = await prisma.sender.findFirst({ where: { userId: user.id } });
    if (!sender) {
      const testAcc = await nodemailer.createTestAccount();
      sender = await prisma.sender.create({
        data: {
          userId: user.id,
          email: testAcc.user,
          name: user.name || 'Outreach Specialist',
          etherealUser: testAcc.user,
          etherealPass: testAcc.pass,
          hourlyLimit: Number(hourlyLimit) || 20,
          minDelaySeconds: Number(delayBetweenEmailsSec) || 2,
        },
      });
    }

    const start = scheduledStartTime ? new Date(scheduledStartTime).getTime() : Date.now();
    const delaySec = Number(delayBetweenEmailsSec) || sender.minDelaySeconds || 2;
    const step = delaySec * 1000;
    const scheduledJobs = [];

    // 3. Create jobs in DB & BullMQ
    for (let i = 0; i < recipients.length; i++) {
      const runAt = start + i * step;
      const job = await prisma.emailJob.create({
        data: {
          userId: user.id,
          senderId: sender.id,
          recipientEmail: recipients[i],
          subject,
          body,
          scheduledAt: new Date(runAt),
          status: 'PENDING',
        },
      });

      // Add delayed job to BullMQ (NO CRON)
      await emailQueue.add(
        'send',
        { id: job.id },
        {
          delay: Math.max(0, runAt - Date.now()),
          jobId: job.id,
        }
      );

      // Safe Elasticsearch index
      try {
        await indexEmail({ ...job, status: 'PENDING' });
      } catch (esErr) {
        // ES sync error does not block email scheduling
      }

      scheduledJobs.push(job);
    }

    console.log(`[Scheduler] Queued ${scheduledJobs.length} emails for ${user.email}`);
    return res.status(201).json({ success: true, count: scheduledJobs.length, items: scheduledJobs });
  } catch (err: any) {
    console.error('[Scheduler Error]:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Scheduled / Sent APIs with fallback and Elasticsearch Search
app.get('/api/emails/:tab', async (req, res) => {
  try {
    const { tab } = req.params;
    let { userId, search } = req.query as { userId?: string; search?: string };
    const statuses = tab === 'scheduled' ? ['PENDING', 'PROCESSING', 'RESCHEDULED'] : ['SENT', 'FAILED'];

    let jobs: any[] = [];

    // 1. Try Elasticsearch first if searching
    if (search && search.trim()) {
      try {
        const esResults = await searchEmails(userId || '', search.trim(), statuses);
        if (esResults && esResults.length > 0) {
          jobs = esResults;
        }
      } catch (esErr) {
        // fallback to database search
      }
    }

    // 2. If Elasticsearch didn't find anything, search database with case-insensitive matching
    if (jobs.length === 0) {
      const isPostgres = (prisma as any)._activeProvider === 'postgresql';
      const term = search?.trim();
      const stringFilter = term
        ? isPostgres
          ? { contains: term, mode: 'insensitive' as any }
          : { contains: term }
        : undefined;

      jobs = await prisma.emailJob.findMany({
        where: {
          status: { in: statuses as any },
          ...(term
            ? {
                OR: [
                  { recipientEmail: stringFilter },
                  { subject: stringFilter },
                  { body: stringFilter },
                ],
              }
            : {}),
        },
        orderBy: tab === 'scheduled' ? { scheduledAt: 'asc' } : { sentAt: 'desc' },
      });
    }

    // 3. Format ALL results (both from ES and DB) so frontend table always renders them
    const formatted = jobs.map((job) => ({
      ...job,
      recipient: job.recipientEmail || job.recipient,
      recipientEmail: job.recipientEmail || job.recipient,
      recipientName: (job.recipientEmail || job.recipient || '').split('@')[0],
      scheduledTime: job.scheduledAt ? new Date(job.scheduledAt).toISOString() : job.scheduledTime || '',
      scheduledAt: job.scheduledAt ? new Date(job.scheduledAt).toISOString() : job.scheduledTime || '',
      sentTime: job.sentAt ? new Date(job.sentAt).toISOString() : job.sentTime || undefined,
      sentAt: job.sentAt ? new Date(job.sentAt).toISOString() : job.sentTime || undefined,
      status: job.status,
    }));

    return res.json(formatted);
  } catch (err: any) {
    console.error('Fetch emails error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Slack OAuth & Status
app.get('/api/slack/oauth/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    const { data } = await axios.post('https://slack.com/api/oauth.v2.access', null, {
      params: {
        code,
        client_id: config.slack.clientId,
        client_secret: config.slack.clientSecret,
        redirect_uri: config.slack.redirectUri,
      },
    });
    await prisma.slackIntegration.upsert({
      where: { userId: String(state) },
      update: {
        accessToken: data.access_token,
        incomingWebhook: data.incoming_webhook?.url,
        channelName: data.incoming_webhook?.channel,
      },
      create: {
        userId: String(state),
        accessToken: data.access_token,
        incomingWebhook: data.incoming_webhook?.url,
        channelName: data.incoming_webhook?.channel,
      },
    });
    res.redirect('http://localhost:3000?slack=connected');
  } catch (err: any) {
    console.error('Slack OAuth error:', err);
    res.redirect('http://localhost:3000?slack=failed');
  }
});

app.get('/api/slack/status', async (req, res) => {
  try {
    const item = await prisma.slackIntegration.findUnique({ where: { userId: String(req.query.userId) } });
    res.json({ isConnected: !!item, channelName: item?.channelName });
  } catch (err: any) {
    res.json({ isConnected: false });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(config.port, () => {
  console.log(`Backend running on :${config.port}`);
  initES();
});
