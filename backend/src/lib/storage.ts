import { env } from '../config/env';
import { HttpError } from '../middleware/errorHandler';

// Compartido entre auth.service.ts (fotos de perfil/portada) y
// conversations.service.ts (fotos/videos de chat, incluyendo Snaps): ambos
// subían y borraban de Supabase Storage con el mismo fetch copiado dos veces.

export function isStorageConfigured() {
  return !!env.SUPABASE_URL && !!env.SUPABASE_SERVICE_ROLE_KEY;
}

function assertStorageConfigured() {
  if (!isStorageConfigured()) {
    throw new HttpError(500, 'La subida de archivos no está configurada en el servidor');
  }
}

export async function uploadToStorage(
  bucket: string,
  path: string,
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  assertStorageConfigured();

  const response = await fetch(`${env.SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, {
    method: 'POST',
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': mimeType,
      'x-upsert': 'true',
    },
    body: buffer,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new HttpError(502, `No se pudo subir el archivo: ${errorText}`);
  }

  return `${env.SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

/** Borra el archivo de Supabase Storage a partir de su URL pública. Best-effort. */
export async function deleteFromStorage(bucket: string, publicUrl: string) {
  if (!isStorageConfigured()) return;

  const marker = `/storage/v1/object/public/${bucket}/`;
  const index = publicUrl.indexOf(marker);
  if (index === -1) return;
  const path = publicUrl.slice(index + marker.length);

  // Quien llama no espera que esto tumbe su petición si falla (el registro ya
  // quedó actualizado igual), pero sin loguearlo un archivo "borrado" puede
  // seguir público en el bucket para siempre sin que nadie se entere.
  try {
    const response = await fetch(`${env.SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, {
      method: 'DELETE',
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });
    if (!response.ok) {
      console.error(`No se pudo borrar el archivo de storage (${response.status}): ${path}`);
    }
  } catch (err) {
    console.error(`No se pudo borrar el archivo de storage: ${path}`, err);
  }
}
