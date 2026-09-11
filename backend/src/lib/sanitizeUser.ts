const ONLINE_THRESHOLD_MS = 45_000;

// También la usa users.service.ts para las tarjetas de "conexiones en común"
// en Descubrir, que solo traen id/name/photoUrl/lastSeenAt (no el resto de
// campos que pide sanitizeUser) y por eso no pueden pasar por esa función.
export function isOnline(lastSeenAt: Date | null): boolean {
  return lastSeenAt !== null && Date.now() - lastSeenAt.getTime() < ONLINE_THRESHOLD_MS;
}

// Las coordenadas nunca salen por aquí. Este serializador se usa en todas las
// respuestas de usuario (Descubrir, miembros, participantes de chat), así que
// exponerlas aquí sería filtrar la ubicación de todo el mundo. La posición
// solo se entrega por el endpoint del mapa, y solo de quien la activó.
export function sanitizeUser<
  T extends {
    passwordHash: string;
    verificationToken: string | null;
    lastSeenAt: Date | null;
    lastLat?: number | null;
    lastLng?: number | null;
    locationUpdatedAt?: Date | null;
  }
>(user: T) {
  const { passwordHash, verificationToken, lastSeenAt, lastLat, lastLng, locationUpdatedAt, ...rest } =
    user;
  return { ...rest, online: isOnline(lastSeenAt) };
}
