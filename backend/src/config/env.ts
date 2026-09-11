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
  // Cuenta de Gmail que manda el código de verificación (requiere una
  // "contraseña de aplicación" de 16 caracteres, no la contraseña normal).
  GMAIL_USER: z.string().email().optional(),
  GMAIL_APP_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
});

export const env = envSchema.parse(process.env);
