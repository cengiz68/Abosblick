import nodemailer from "nodemailer";

export interface Mail {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

let transport: nodemailer.Transporter | null = null;

export async function sendMail(mail: Mail) {
  if (!process.env.SMTP_URL) {
    console.log(`[mail] An: ${mail.to}\n[mail] Betreff: ${mail.subject}\n${mail.text}\n[mail] ---`);
    return;
  }
  transport ??= nodemailer.createTransport(process.env.SMTP_URL);
  await transport.sendMail({ from: process.env.MAIL_FROM, ...mail });
}
