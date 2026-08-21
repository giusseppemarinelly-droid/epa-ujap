const ONLINE_THRESHOLD_MS = 45_000;

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
  const online = lastSeenAt !== null && Date.now() - lastSeenAt.getTime() < ONLINE_THRESHOLD_MS;
  return { ...rest, online };
}
