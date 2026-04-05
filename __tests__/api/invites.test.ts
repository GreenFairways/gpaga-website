import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSql, mockCanManage, mockGetPlayerId, mockIsAdmin } = vi.hoisted(() => ({
  mockSql: vi.fn(),
  mockCanManage: vi.fn(),
  mockGetPlayerId: vi.fn(),
  mockIsAdmin: vi.fn(),
}));

vi.mock("../../src/lib/db", () => ({ sql: (...args: unknown[]) => mockSql(...args) }));
vi.mock("../../src/lib/auth/permissions", () => ({
  canManageTournament: (...args: unknown[]) => mockCanManage(...args),
  isCreatorOrAdmin: (...args: unknown[]) => mockCanManage(...args),
}));
vi.mock("../../src/lib/auth/player-session", () => ({ getAuthenticatedPlayerId: () => mockGetPlayerId() }));
vi.mock("../../src/lib/auth/session", () => ({ isAdmin: () => mockIsAdmin() }));

// Mock mappers
vi.mock("../../src/lib/db/mappers", () => ({
  mapInvite: (row: any) => ({
    id: row.id,
    tournamentId: row.tournament_id,
    invitedPlayerId: row.invited_player_id,
    inviteCode: row.invite_code,
    status: row.status,
  }),
  mapOrganizer: (row: any) => ({
    id: row.id,
    tournamentId: row.tournament_id,
    playerId: row.player_id,
    role: row.role,
  }),
}));

import { GET as getInvites, POST as createInvite } from "../../src/app/api/tournaments/[id]/invites/route";
import { GET as getOrganizers, POST as addOrganizer, DELETE as removeOrganizer } from "../../src/app/api/tournaments/[id]/organizers/route";
import { NextRequest } from "next/server";

const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  mockSql.mockReset();
  mockCanManage.mockReset();
  mockGetPlayerId.mockReset();
  mockIsAdmin.mockReset();
});

describe("GET /api/tournaments/[id]/invites", () => {
  it("rejects unauthorized", async () => {
    mockCanManage.mockResolvedValue(false);
    const res = await getInvites(
      new NextRequest("http://localhost/api/tournaments/t-1/invites"),
      makeParams("t-1"),
    );
    expect(res.status).toBe(401);
  });

  it("returns invites for organizer", async () => {
    mockCanManage.mockResolvedValue(true);
    mockSql.mockResolvedValue({
      rows: [
        { id: "i-1", tournament_id: "t-1", invited_player_id: "p-2", invite_code: "ABC123DE", status: "pending", first_name: "Jane", last_name: "Doe" },
      ],
    });

    const res = await getInvites(
      new NextRequest("http://localhost/api/tournaments/t-1/invites"),
      makeParams("t-1"),
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(1);
    expect(data[0].invitedPlayerName).toBe("Jane Doe");
  });
});

describe("POST /api/tournaments/[id]/invites", () => {
  it("rejects without auth", async () => {
    mockCanManage.mockResolvedValue(false);
    const res = await createInvite(
      new NextRequest("http://localhost/api/tournaments/t-1/invites", {
        method: "POST",
        body: JSON.stringify({ playerId: "p-2" }),
      }),
      makeParams("t-1"),
    );
    expect(res.status).toBe(401);
  });

  it("requires playerId or email", async () => {
    mockCanManage.mockResolvedValue(true);
    mockGetPlayerId.mockResolvedValue("p-1");
    const res = await createInvite(
      new NextRequest("http://localhost/api/tournaments/t-1/invites", {
        method: "POST",
        body: JSON.stringify({}),
      }),
      makeParams("t-1"),
    );
    expect(res.status).toBe(400);
  });

  it("creates invite for a player", async () => {
    mockCanManage.mockResolvedValue(true);
    mockGetPlayerId.mockResolvedValue("p-1");
    mockSql
      .mockResolvedValueOnce({ rows: [] }) // no existing invite
      .mockResolvedValueOnce({
        rows: [{ id: "i-new", tournament_id: "t-1", invited_player_id: "p-2", invite_code: "XYZW1234", status: "pending" }],
      });

    const res = await createInvite(
      new NextRequest("http://localhost/api/tournaments/t-1/invites", {
        method: "POST",
        body: JSON.stringify({ playerId: "p-2" }),
      }),
      makeParams("t-1"),
    );
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.inviteCode).toBe("XYZW1234");
  });

  it("rejects duplicate invite", async () => {
    mockCanManage.mockResolvedValue(true);
    mockGetPlayerId.mockResolvedValue("p-1");
    mockSql.mockResolvedValueOnce({ rows: [{ "?column?": 1 }] }); // existing pending invite

    const res = await createInvite(
      new NextRequest("http://localhost/api/tournaments/t-1/invites", {
        method: "POST",
        body: JSON.stringify({ playerId: "p-2" }),
      }),
      makeParams("t-1"),
    );
    expect(res.status).toBe(409);
  });
});

describe("Organizers API", () => {
  it("lists organizers (public)", async () => {
    mockSql.mockResolvedValue({
      rows: [
        { id: "o-1", tournament_id: "t-1", player_id: "p-1", role: "creator", first_name: "Stas", last_name: "G", email: "s@g.com" },
      ],
    });

    const res = await getOrganizers(
      new NextRequest("http://localhost/api/tournaments/t-1/organizers"),
      makeParams("t-1"),
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(1);
    expect(data[0].playerName).toBe("Stas G");
  });

  it("adds co-organizer (creator only)", async () => {
    mockCanManage.mockResolvedValue(true); // isCreatorOrAdmin
    mockSql
      .mockResolvedValueOnce({ rows: [{ "?column?": 1 }] }) // player exists
      .mockResolvedValueOnce({ rows: [] }) // not already organizer
      .mockResolvedValueOnce({
        rows: [{ id: "o-2", tournament_id: "t-1", player_id: "p-3", role: "co_organizer" }],
      });

    const res = await addOrganizer(
      new NextRequest("http://localhost/api/tournaments/t-1/organizers", {
        method: "POST",
        body: JSON.stringify({ playerId: "p-3" }),
      }),
      makeParams("t-1"),
    );
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.role).toBe("co_organizer");
  });

  it("cannot remove creator", async () => {
    mockCanManage.mockResolvedValue(true);
    mockSql.mockResolvedValueOnce({ rows: [{ role: "creator" }] });

    const res = await removeOrganizer(
      new NextRequest("http://localhost/api/tournaments/t-1/organizers", {
        method: "DELETE",
        body: JSON.stringify({ playerId: "p-1" }),
      }),
      makeParams("t-1"),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/creator/i);
  });
});

describe("Player search", () => {
  it("requires auth", async () => {
    mockIsAdmin.mockResolvedValue(false);
    mockGetPlayerId.mockResolvedValue(null);

    // Import inline to avoid circular mock issues
    const { GET: searchPlayers } = await import("../../src/app/api/players/search/route");

    const res = await searchPlayers(
      new NextRequest("http://localhost/api/players/search?q=john"),
    );
    expect(res.status).toBe(401);
  });

  it("requires query of at least 2 chars", async () => {
    mockIsAdmin.mockResolvedValue(true);
    mockGetPlayerId.mockResolvedValue(null);

    const { GET: searchPlayers } = await import("../../src/app/api/players/search/route");

    const res = await searchPlayers(
      new NextRequest("http://localhost/api/players/search?q=j"),
    );
    expect(res.status).toBe(400);
  });

  it("returns matching players", async () => {
    mockIsAdmin.mockResolvedValue(true);
    mockGetPlayerId.mockResolvedValue(null);
    mockSql.mockResolvedValue({
      rows: [
        { id: "p-1", first_name: "John", last_name: "Doe", email: "john@doe.com", handicap_index: "15.3" },
      ],
    });

    const { GET: searchPlayers } = await import("../../src/app/api/players/search/route");

    const res = await searchPlayers(
      new NextRequest("http://localhost/api/players/search?q=john"),
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(1);
    expect(data[0].firstName).toBe("John");
    expect(data[0].handicapIndex).toBe(15.3);
  });
});
