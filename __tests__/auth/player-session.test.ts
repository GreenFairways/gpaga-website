import { describe, it, expect, vi, beforeEach } from "vitest";

// vi.hoisted ensures these are available when vi.mock factories run (hoisted)
const { mockCookieStore, mockSign } = vi.hoisted(() => {
  const mockSign = vi.fn().mockResolvedValue("mock-jwt-token");
  return {
    mockCookieStore: {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
    },
    mockSign,
  };
});

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

vi.mock("jose", () => {
  class MockSignJWT {
    setProtectedHeader() { return this; }
    setIssuedAt() { return this; }
    setExpirationTime() { return this; }
    sign() { return mockSign(); }
  }
  return {
    SignJWT: MockSignJWT,
    jwtVerify: vi.fn(),
  };
});

import {
  hashPassword,
  verifyPassword,
  createPlayerSession,
  getAuthenticatedPlayerId,
  destroyPlayerSession,
} from "../../src/lib/auth/player-session";
import { jwtVerify } from "jose";

describe("hashPassword / verifyPassword", () => {
  it("hashes and verifies a password", async () => {
    const password = "TestPass123!";
    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);
    expect(hash.startsWith("$2a$") || hash.startsWith("$2b$")).toBe(true);
    expect(await verifyPassword(password, hash)).toBe(true);
  });

  it("rejects wrong password", async () => {
    const hash = await hashPassword("correct-password");
    expect(await verifyPassword("wrong-password", hash)).toBe(false);
  });

  it("generates different hashes for same password (salt)", async () => {
    const h1 = await hashPassword("same");
    const h2 = await hashPassword("same");
    expect(h1).not.toBe(h2);
  });

  it("produces a hash of max 72 bytes input (bcrypt limit)", async () => {
    const longPass = "a".repeat(100);
    const hash = await hashPassword(longPass);
    expect(hash).toBeTruthy();
    expect(await verifyPassword(longPass, hash)).toBe(true);
  });
});

describe("createPlayerSession", () => {
  beforeEach(() => {
    vi.stubEnv("PLAYER_JWT_SECRET", "test-secret-at-least-32-chars-long");
    mockCookieStore.set.mockClear();
    mockSign.mockClear();
  });

  it("sets a cookie with the JWT token", async () => {
    mockSign.mockResolvedValueOnce("test-token-123");
    await createPlayerSession("player-uuid");

    expect(mockCookieStore.set).toHaveBeenCalledWith(
      "gpaga-player",
      "test-token-123",
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
      }),
    );
  });
});

describe("getAuthenticatedPlayerId", () => {
  beforeEach(() => {
    vi.stubEnv("PLAYER_JWT_SECRET", "test-secret-at-least-32-chars-long");
    mockCookieStore.get.mockClear();
  });

  it("returns null when no cookie", async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    expect(await getAuthenticatedPlayerId()).toBeNull();
  });

  it("returns player ID from valid token", async () => {
    mockCookieStore.get.mockReturnValue({ value: "valid-token" });
    vi.mocked(jwtVerify).mockResolvedValueOnce({
      payload: { sub: "player-123", role: "player" },
      protectedHeader: { alg: "HS256" },
    } as any);

    expect(await getAuthenticatedPlayerId()).toBe("player-123");
  });

  it("returns null on invalid token", async () => {
    mockCookieStore.get.mockReturnValue({ value: "bad-token" });
    vi.mocked(jwtVerify).mockRejectedValueOnce(new Error("invalid"));

    expect(await getAuthenticatedPlayerId()).toBeNull();
  });
});

describe("destroyPlayerSession", () => {
  beforeEach(() => {
    mockCookieStore.delete.mockClear();
  });

  it("deletes the gpaga-player cookie", async () => {
    await destroyPlayerSession();
    expect(mockCookieStore.delete).toHaveBeenCalledWith("gpaga-player");
  });
});
