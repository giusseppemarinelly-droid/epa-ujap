import { env } from '../config/env';
import { HttpError } from '../middleware/errorHandler';

// Todo sale por HTTPS y no por SMTP: Render free bloquea la salida a los
// puertos 25/465/587 desde sep-2025, así que Gmail SMTP se quedaba colgado.
// Hay dos transportes; si ambos están configurados gana el relay.
// - Relay de Google Apps Script (backend/scripts/mail-relay.gs): manda desde
//   la cuenta de Gmail que publicó el script. Límite 100 correos/día.
// - API de Brevo: 300/día, pero la cuenta necesita aprobación manual.
type Email = { to: string; subject: string; text: string; html: string };

const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

async function sendViaRelay(email: Email) {
  // Apps Script responde a los POST con un redirect a googleusercontent.com y
  // siempre con HTTP 200, así que el resultado real viene en el JSON. Tras un
  // rato sin uso su primera ejecución puede pasar de 15 s. El tope va por
  // debajo de los 30 s con que la app corta cada request (src/lib/api.ts),
  // para que al usuario le llegue este error y no uno de conexión.
  let response: Response;
  try {
    response = await fetch(env.MAIL_RELAY_URL!, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ secret: env.MAIL_RELAY_SECRET, ...email }),
      signal: AbortSignal.timeout(25_000),
    });
  } catch (err) {
    console.error('El relay de correo no respondió', err);
    throw new HttpError(504, 'El correo está tardando más de lo normal, intenta de nuevo');
  }
  const result = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
  if (!response.ok || !result?.ok) {
    console.error('El relay de correo falló', response.status, result?.error);
    throw new HttpError(502, 'No pudimos mandar el correo, intenta de nuevo en un rato');
  }
}

async function sendViaBrevo(email: Email) {
  const response = await fetch(BREVO_URL, {
    method: 'POST',
    headers: {
      'api-key': env.BREVO_API_KEY!,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'Epa', email: env.EMAIL_SENDER },
      to: [{ email: email.to }],
      subject: email.subject,
      textContent: email.text,
      htmlContent: email.html,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    console.error('Brevo rechazó el correo', response.status, await response.text());
    throw new HttpError(502, 'No pudimos mandar el correo, intenta de nuevo en un rato');
  }
}

function send(email: Email) {
  if (env.MAIL_RELAY_URL && env.MAIL_RELAY_SECRET) return sendViaRelay(email);
  if (env.BREVO_API_KEY && env.EMAIL_SENDER) return sendViaBrevo(email);
  throw new HttpError(500, 'El envío de correo no está configurado en el servidor');
}

export async function sendVerificationEmail(to: string, code: string) {
  await send({
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
