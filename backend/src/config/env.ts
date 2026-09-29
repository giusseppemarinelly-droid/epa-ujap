import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es requerido'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
  PORT: z.coerce.number().default(4000),
  // Temporal: hasta tener acceso a un remitente institucional, se registra con
  // Gmail y el código de verificación llega a esa misma bandeja.
  ALLOWED_EMAIL_DOMAIN: z.string().default('gmail.com'),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  // URL de la web app de Google Apps Script que manda los correos (ver
  // backend/scripts/mail-relay.gs) y la clave compartida que valida el script.
  MAIL_RELAY_URL: z.string().url().optional(),
  MAIL_RELAY_SECRET: z.string().min(24, 'MAIL_RELAY_SECRET debe tener al menos 24 caracteres').optional(),
  // Alternativa al relay: API key de Brevo (app.brevo.com → SMTP & API → API keys) y el correo
  // remitente, que tiene que estar verificado como sender en Brevo.
  BREVO_API_KEY: z.string().optional(),
  EMAIL_SENDER: z.string().email().optional(),
  // Orígenes extra separados por coma para CORS, además de los de desarrollo
  // local ya incluidos por defecto (ver index.ts). En producción el front se
  // sirve desde el mismo origen que la API, así que normalmente no hace falta.
  ALLOWED_ORIGINS: z.string().optional(),
});

export const env = envSchema.parse(process.env);
