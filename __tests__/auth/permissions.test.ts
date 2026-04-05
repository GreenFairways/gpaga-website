import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockIsAdmin, mockGetPlayerId, mockSql } = vi.hoisted(() => ({
  mockIsAdmin: vi.fn(),
  mockGetPlayerId: vi.fn(),
  mockSql: vi.fn(),
}));

vi.mock("../../src/lib/auth/session", () => ({ isAdmin: () => mockIsAdmin() }));
vi.mock("../../src/lib/auth/player-session", () => ({ getAuthenticatedPlayerId: () => mockGetPlayerId() }));
vi.mock("../../src/lib/db", () => ({ sql: (...args: unknown[]) => mockSql(...args) }));

import {
  getAuthContext,
  canManageTournament,
  isCreatorOrAdmin,
  canViewTournament,
} from "../../src/lib/auth/permissions";

beforeEach(() => {
  mockIsAdmin.mockReset();
  mockGetPlayerId.mockReset();
  mockSql.mockReset();
});

describe("getAuthContext", () => {
  it("returns admin context", async () => {
    mockIsAdmin.mockResolvedValue(true);
    mockGetPlayerId.mockResolvedValue(null);
    const ctx = await getAuthContext();
    expect(ctx).toEqual({ isAdmin: true, playerId: null });
  });

  it("returns player context", async () => {
    mockIsAdmin.mockResolvedValue(false);
    mockGetPlayerId.mockResolvedValue("p-1");
    const ctx = await getAuthContext();
    expect(ctx).toEqual({ isAdmin: false, playerId: "p-1" });
  });

  it("returns unauthenticated context", async () => {
    mockIsAdmin.mockResolvedValue(false);
    mockGetPlayerId.mockResolvedValue(null);
    const ctx = await getAuthContext();
    expect(ctx).toEqual({ isAdmin: false, playerId: null });
  });
});

describe("canManageTournament", () => {
  it("admin can always manage", async () => {
    mockIsAdmin.mockResolvedValue(true);
    expect(await canManageTournament("t-1")).toBe(true);
  });

  it("unauthenticated cannot manage", async () => {
    mockIsAdmin.mockResolvedValue(false);
    mockGetPlayerId.mockResolvedValue(null);
    expect(await canManageTournament("t-1")).toBe(false);
  });

  it("organizer can manage", async () => {
    mockIsAdmin.mockResolvedValue(false);
    mockGetPlayerId.mockResolvedValue("p-1");
    mockSql.mockResolvedValue({ rows: [{ "?column?": 1 }] });
    expect(await canManageTournament("t-1")).toBe(true);
  });

  it("non-organizer player cannot manage", async () => {
    mockIsAdmin.mockResolvedValue(false);
    mockGetPlayerId.mockResolvedValue("p-2");
    mockSql.mockResolvedValue({ rows: [] });
    expect(await canManageTournament("t-1")).toBe(false);
  });
});

describe("isCreatorOrAdmin", () => {
  it("admin is always creator-level", async () => {
    mockIsAdmin.mockResolvedValue(true);
    expect(await isCreatorOrAdmin("t-1")).toBe(true);
  });

  it("creator has creator-level access", async () => {
    mockIsAdmin.mockResolvedValue(false);
    mockGetPlayerId.mockResolvedValue("p-1");
    mockSql.mockResolvedValue({ rows: [{ "?column?": 1 }] });
    expect(await isCreatorOrAdmin("t-1")).toBe(true);
  });

  it("co-organizer does NOT have creator-level access", async () => {
    mockIsAdmin.mockResolvedValue(false);
    mockGetPlayerId.mockResolvedValue("p-3");
    mockSql.mockResolvedValue({ rows: [] });
    expect(await isCreatorOrAdmin("t-1")).toBe(false);
  });

  it("unauthenticated is denied", async () => {
    mockIsAdmin.mockResolvedValue(false);
    mockGetPlayerId.mockResolvedValue(null);
    expect(await isCreatorOrAdmin("t-1")).toBe(false);
  });
});

describe("canViewTournament", () => {
  it("public tournament visible to anyone", async () => {
    mockSql.mockResolvedValue({ rows: [{ visibility: "public" }] });
    expect(await canViewTournament("t-1")).toBe(true);
  });

  it("unlisted tournament visible to anyone with link", async () => {
    mockSql.mockResolvedValue({ rows: [{ visibility: "unlisted" }] });
    expect(await canViewTournament("t-1")).toBe(true);
  });

  it("non-existent tournament returns false", async () => {
    mockSql.mockResolvedValue({ rows: [] });
    expect(await canViewTournament("t-missing")).toBe(false);
  });

  it("private tournament visible to admin", async () => {
    mockSql.mockResolvedValueOnce({ rows: [{ visibility: "private" }] });
    mockIsAdmin.mockResolvedValue(true);
    expect(await canViewTournament("t-1")).toBe(true);
  });

  it("private tournament visible to organizer", async () => {
    mockSql
      .mockResolvedValueOnce({ rows: [{ visibility: "private" }] }) // visibility check
      .mockResolvedValueOnce({ rows: [{ "?column?": 1 }] }); // organizer check
    mockIsAdmin.mockResolvedValue(false);
    mockGetPlayerId.mockResolvedValue("p-1");
    expect(await canViewTournament("t-1")).toBe(true);
  });

  it("private tournament visible to invited player", async () => {
    mockSql
      .mockResolvedValueOnce({ rows: [{ visibility: "private" }] }) // visibility
      .mockResolvedValueOnce({ rows: [] }) // not organizer
      .mockResolvedValueOnce({ rows: [{ "?column?": 1 }] }); // invited
    mockIsAdmin.mockResolvedValue(false);
    mockGetPlayerId.mockResolvedValue("p-2");
    expect(await canViewTournament("t-1")).toBe(true);
  });

  it("private tournament visible to registered player", async () => {
    mockSql
      .mockResolvedValueOnce({ rows: [{ visibility: "private" }] }) // visibility
      .mockResolvedValueOnce({ rows: [] }) // not organizer
      .mockResolvedValueOnce({ rows: [] }) // not invited
      .mockResolvedValueOnce({ rows: [{ "?column?": 1 }] }); // registered
    mockIsAdmin.mockResolvedValue(false);
    mockGetPlayerId.mockResolvedValue("p-3");
    expect(await canViewTournament("t-1")).toBe(true);
  });

  it("private tournament hidden from random player", async () => {
    mockSql
      .mockResolvedValueOnce({ rows: [{ visibility: "private" }] })
      .mockResolvedValueOnce({ rows: [] }) // not organizer
      .mockResolvedValueOnce({ rows: [] }) // not invited
      .mockResolvedValueOnce({ rows: [] }); // not registered
    mockIsAdmin.mockResolvedValue(false);
    mockGetPlayerId.mockResolvedValue("p-99");
    expect(await canViewTournament("t-1")).toBe(false);
  });

  it("private tournament hidden from unauthenticated", async () => {
    mockSql.mockResolvedValueOnce({ rows: [{ visibility: "private" }] });
    mockIsAdmin.mockResolvedValue(false);
    mockGetPlayerId.mockResolvedValue(null);
    expect(await canViewTournament("t-1")).toBe(false);
  });
});
