/**
 * Player session management via JWT cookies + bcrypt password hashing.
 *
 * Separate from admin auth (session.ts):
 * - Cookie: gpaga-player (not gpaga-admin)
 * - Secret: PLAYER_JWT_SECRET (not ADMIN_SECRET)
 * - Payload: { sub: playerId, role: "player" }
 * - Expiry: 30 days
 */

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

const COOKIE_NAME = "gpaga-player";
const EXPIRES_IN = "30d";
const SALT_ROUNDS = 10;

function getSecret(): Uint8Array {
  const secret = process.env.PLAYER_JWT_SECRET;
  if (!secret) throw new Error("PLAYER_JWT_SECRET env var is not set");
  return new TextEncoder().encode(secret);
}

/** Hash a password for storage. */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/** Verify a password against a stored hash. */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Create a player JWT session cookie. */
export async function createPlayerSession(playerId: string): Promise<void> {
  const token = await new SignJWT({ sub: playerId, role: "player" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(EXPIRES_IN)
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });
}

/** Get the authenticated player ID from the session cookie. Returns null if not authenticated. */
export async function getAuthenticatedPlayerId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, getSecret());
    return (payload.sub as string) || null;
  } catch {
    return null;
  }
}

/** Clear the player session cookie. */
export async function destroyPlayerSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
