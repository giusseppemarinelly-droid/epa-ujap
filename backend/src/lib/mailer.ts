import nodemailer from 'nodemailer';

import { env } from '../config/env';
import { HttpError } from '../middleware/errorHandler';

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!env.GMAIL_USER || !env.GMAIL_APP_PASSWORD) {
    throw new HttpError(500, 'El envío de correo no está configurado en el servidor');
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: env.GMAIL_USER, pass: env.GMAIL_APP_PASSWORD },
    });
  }
  return transporter;
}

export async function sendVerificationEmail(to: string, code: string) {
  const transport = getTransporter();
  await transport.sendMail({
    from: env.EMAIL_FROM || `Epa <${env.GMAIL_USER}>`,
    to,
    subject: 'Tu código para entrar a Epa',
    text: `Épale, ya casi. Tu código para verificar tu cuenta en Epa es ${code}. Vence en 30 minutos.`,
    html:
      '<div style="font-family:sans-serif;font-size:15px;color:#221C1B;">' +
      '<p>Épale, ya casi. Este es tu código para verificar tu cuenta en <b>Epa</b>:</p>' +
      `<p style="font-size:28px;font-weight:700;letter-spacing:4px;margin:16px 0;">${code}</p>` +
      '<p>Vence en 30 minutos. Si tú no pediste esto, ignora este correo.</p>' +
      '</div>',
  });
}
