import nodemailer from 'nodemailer';

export async function sendEmail({ user, pass, from, to, subject, body }: any) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: { user, pass },
  });

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    text: body,
    html: `<div>${body.replace(/\n/g, '<br/>')}</div>`,
  });

  return { previewUrl: nodemailer.getTestMessageUrl(info) };
}
