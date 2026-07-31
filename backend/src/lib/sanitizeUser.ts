const ONLINE_THRESHOLD_MS = 45_000;

export function sanitizeUser<
  T extends { passwordHash: string; verificationToken: string | null; lastSeenAt: Date | null }
>(user: T) {
  const { passwordHash, verificationToken, lastSeenAt, ...rest } = user;
  const online = lastSeenAt !== null && Date.now() - lastSeenAt.getTime() < ONLINE_THRESHOLD_MS;
  return { ...rest, online };
}
