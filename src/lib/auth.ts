import crypto from "crypto";

// Simple token store (in-memory for development)
// In production, you'd use a proper session store or JWT
// Use globalThis to preserve the store across HMR (hot module replacement)
const globalForAuth = globalThis as unknown as {
  tokenStore: Map<string, { userId: string; expiresAt: number }> | undefined;
};
const tokenStore =
  globalForAuth.tokenStore ??
  new Map<string, { userId: string; expiresAt: number }>();
if (process.env.NODE_ENV !== "production") globalForAuth.tokenStore = tokenStore;

const TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function createSession(userId: string): string {
  const token = generateToken();
  tokenStore.set(token, {
    userId,
    expiresAt: Date.now() + TOKEN_EXPIRY,
  });
  return token;
}

export function validateToken(
  token: string
): { userId: string } | null {
  const session = tokenStore.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    tokenStore.delete(token);
    return null;
  }
  return { userId: session.userId };
}

export function destroySession(token: string): void {
  tokenStore.delete(token);
}
