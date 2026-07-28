export function sanitizeUser<T extends { passwordHash: string; verificationToken: string | null }>(
  user: T
) {
  const { passwordHash, verificationToken, ...rest } = user;
  return rest;
}
