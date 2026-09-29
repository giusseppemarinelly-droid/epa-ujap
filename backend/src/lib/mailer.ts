import { env } from '../config/env';
import { HttpError } from '../middleware/errorHandler';

// Se manda por la API HTTPS de Brevo y no por SMTP: Render free bloquea la
// salida a los puertos 25/465/587 desde sep-2025, así que Gmail SMTP se
// quedaba colgado hasta el timeout.
const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

export async function sendVerificationEmail(to: string, code: string) {
  if (!env.BREVO_API_KEY || !env.EMAIL_SENDER) {
    throw new HttpError(500, 'El envío de correo no está configurado en el servidor');
  }

  const response = await fetch(BREVO_URL, {
    method: 'POST',
    headers: {
      'api-key': env.BREVO_API_KEY,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'Epa', email: env.EMAIL_SENDER },
      to: [{ email: to }],
      subject: 'Tu código para entrar a Epa',
      textContent: `Épale, ya casi. Tu código para verificar tu cuenta en Epa es ${code}. Vence en 30 minutos.`,
      htmlContent:
        '<div style="font-family:sans-serif;font-size:15px;color:#221C1B;">' +
        '<p>Épale, ya casi. Este es tu código para verificar tu cuenta en <b>Epa</b>:</p>' +
        `<p style="font-size:28px;font-weight:700;letter-spacing:4px;margin:16px 0;">${code}</p>` +
        '<p>Vence en 30 minutos. Si tú no pediste esto, ignora este correo.</p>' +
        '</div>',
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    console.error('Brevo rechazó el correo', response.status, await response.text());
    throw new HttpError(502, 'No pudimos mandar el correo, intenta de nuevo en un rato');
  }
}
