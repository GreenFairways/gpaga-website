import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSql, mockHashPassword, mockCreatePlayerSession, mockVerifyPassword } = vi.hoisted(() => ({
  mockSql: vi.fn(),
  mockHashPassword: vi.fn(),
  mockCreatePlayerSession: vi.fn(),
  mockVerifyPassword: vi.fn(),
}));

vi.mock("../../src/lib/db", () => ({ sql: (...args: unknown[]) => mockSql(...args) }));
vi.mock("../../src/lib/auth/player-session", () => ({
  hashPassword: (...args: unknown[]) => mockHashPassword(...args),
  createPlayerSession: (...args: unknown[]) => mockCreatePlayerSession(...args),
  verifyPassword: (...args: unknown[]) => mockVerifyPassword(...args),
}));
vi.mock("../../src/lib/db/mappers", () => ({
  mapPlayer: (row: any) => ({ id: row.id, firstName: row.first_name, lastName: row.last_name, email: row.email }),
}));
vi.mock("../../src/lib/auth/session", () => ({ createSession: vi.fn() }));

import { POST as registerHandler } from "../../src/app/api/auth/register/route";
import { POST as loginHandler } from "../../src/app/api/auth/login/route";

function makeRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost/api/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    mockSql.mockReset();
    mockHashPassword.mockReset();
    mockCreatePlayerSession.mockReset();
    mockHashPassword.mockResolvedValue("$2a$10$hashed");
    mockCreatePlayerSession.mockResolvedValue(undefined);
  });

  it("rejects missing required fields", async () => {
    const res = await registerHandler(makeRequest({ email: "a@b.com" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/Required/);
  });

  it("rejects short password", async () => {
    const res = await registerHandler(
      makeRequest({
        email: "a@b.com",
        password: "short",
        firstName: "A",
        lastName: "B",
        gender: "M",
      }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/8 characters/);
  });

  it("rejects invalid gender", async () => {
    const res = await registerHandler(
      makeRequest({
        email: "a@b.com",
        password: "longpassword",
        firstName: "A",
        lastName: "B",
        gender: "X",
      }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/Gender/);
  });

  it("creates new player", async () => {
    mockSql
      .mockResolvedValueOnce({ rows: [] }) // no existing
      .mockResolvedValueOnce({ rows: [{ id: "new-id" }] }) // insert
      .mockResolvedValueOnce({
        rows: [{ id: "new-id", first_name: "John", last_name: "Doe", email: "j@d.com" }],
      }); // select after insert

    const res = await registerHandler(
      makeRequest({
        email: "j@d.com",
        password: "password123",
        firstName: "John",
        lastName: "Doe",
        gender: "M",
      }),
    );

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.id).toBe("new-id");
    expect(mockCreatePlayerSession).toHaveBeenCalledWith("new-id");
  });

  it("claims admin-created account (no password_hash)", async () => {
    mockSql
      .mockResolvedValueOnce({ rows: [{ id: "existing-id", password_hash: null }] }) // existing, no pw
      .mockResolvedValueOnce({ rows: [] }) // update password
      .mockResolvedValueOnce({
        rows: [{ id: "existing-id", first_name: "Pre", last_name: "Made", email: "pre@made.com" }],
      });

    const res = await registerHandler(
      makeRequest({
        email: "pre@made.com",
        password: "claimaccount!",
        firstName: "Pre",
        lastName: "Made",
        gender: "F",
      }),
    );

    expect(res.status).toBe(201);
    expect(mockCreatePlayerSession).toHaveBeenCalledWith("existing-id");
  });

  it("rejects if account already has password", async () => {
    mockSql.mockResolvedValueOnce({
      rows: [{ id: "existing-id", password_hash: "$2a$10$somehash" }],
    });

    const res = await registerHandler(
      makeRequest({
        email: "taken@email.com",
        password: "password123",
        firstName: "A",
        lastName: "B",
        gender: "M",
      }),
    );

    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/already exists/);
  });
});

describe("POST /api/auth/login (player path)", () => {
  beforeEach(() => {
    mockSql.mockReset();
    mockVerifyPassword.mockReset();
    mockCreatePlayerSession.mockReset();
    mockCreatePlayerSession.mockResolvedValue(undefined);
  });

  it("rejects unknown email", async () => {
    mockSql.mockResolvedValueOnce({ rows: [] });

    const res = await loginHandler(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: "nope@nope.com", password: "pass1234" }),
      }),
    );

    expect(res.status).toBe(401);
    expect((await res.json()).error).toMatch(/Invalid/);
  });

  it("rejects player without password (admin-created, not claimed)", async () => {
    mockSql.mockResolvedValueOnce({
      rows: [{ id: "p-1", first_name: "A", last_name: "B", password_hash: null }],
    });

    const res = await loginHandler(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: "pre@made.com", password: "anything" }),
      }),
    );

    expect(res.status).toBe(401);
    expect((await res.json()).error).toMatch(/register/i);
  });

  it("rejects wrong password", async () => {
    mockSql.mockResolvedValueOnce({
      rows: [{ id: "p-1", first_name: "A", last_name: "B", password_hash: "$2a$hash" }],
    });
    mockVerifyPassword.mockResolvedValueOnce(false);

    const res = await loginHandler(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: "user@e.com", password: "wrong" }),
      }),
    );

    expect(res.status).toBe(401);
  });

  it("succeeds with correct credentials", async () => {
    mockSql.mockResolvedValueOnce({
      rows: [{ id: "p-1", first_name: "John", last_name: "Doe", password_hash: "$2a$hash" }],
    });
    mockVerifyPassword.mockResolvedValueOnce(true);

    const res = await loginHandler(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: "john@doe.com", password: "correct" }),
      }),
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.playerId).toBe("p-1");
    expect(data.playerName).toBe("John Doe");
    expect(mockCreatePlayerSession).toHaveBeenCalledWith("p-1");
  });
});
