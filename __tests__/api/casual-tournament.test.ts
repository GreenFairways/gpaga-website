import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSql, mockIsAdmin, mockGetPlayerId, mockCanManage, mockIsCreatorOrAdmin, mockCanView } = vi.hoisted(() => {
  const mockSql = Object.assign(vi.fn(), { query: vi.fn() });
  const mockIsAdmin = vi.fn();
  const mockGetPlayerId = vi.fn();
  const mockCanManage = vi.fn();
  const mockIsCreatorOrAdmin = vi.fn();
  const mockCanView = vi.fn();
  return { mockSql, mockIsAdmin, mockGetPlayerId, mockCanManage, mockIsCreatorOrAdmin, mockCanView };
});

vi.mock("../../src/lib/db", () => ({ sql: mockSql }));
vi.mock("../../src/lib/auth/session", () => ({ isAdmin: () => mockIsAdmin() }));
vi.mock("../../src/lib/auth/player-session", () => ({ getAuthenticatedPlayerId: () => mockGetPlayerId() }));
vi.mock("../../src/lib/auth/permissions", () => ({
  canManageTournament: (...args: unknown[]) => mockCanManage(...args),
  isCreatorOrAdmin: (...args: unknown[]) => mockIsCreatorOrAdmin(...args),
  canViewTournament: (...args: unknown[]) => mockCanView(...args),
  getAuthContext: () => Promise.resolve({ isAdmin: mockIsAdmin(), playerId: mockGetPlayerId() }),
}));

// Mock mappers
vi.mock("../../src/lib/db/mappers", () => ({
  mapTournament: (row: any) => ({
    id: row.id,
    name: row.name,
    tournamentType: row.tournament_type || "official",
    visibility: row.visibility || "public",
    creatorId: row.creator_id || null,
  }),
}));

// Need to also mock courses module used by POST
vi.mock("../../src/data/courses", () => ({
  getCourse: vi.fn().mockReturnValue({
    id: "test-course",
    name: "Test",
    tees: [{ name: "Blue", par: 72 }],
  }),
}));

import { GET, POST } from "../../src/app/api/tournaments/route";
import { NextRequest } from "next/server";

function makeGetRequest(params = ""): NextRequest {
  return new NextRequest(`http://localhost/api/tournaments${params}`);
}

function makePostRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost/api/tournaments", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  mockSql.mockReset();
  mockSql.query.mockReset();
  mockIsAdmin.mockReset();
  mockGetPlayerId.mockReset();
  mockCanManage.mockReset();
  mockIsCreatorOrAdmin.mockReset();
  mockCanView.mockReset();
});

describe("GET /api/tournaments — visibility", () => {
  it("unauthenticated sees only public tournaments", async () => {
    mockIsAdmin.mockResolvedValue(false);
    mockGetPlayerId.mockResolvedValue(null);
    mockSql.mockResolvedValue({
      rows: [
        { id: "t-1", name: "Public Open", tournament_type: "official", visibility: "public" },
      ],
    });

    const res = await GET(makeGetRequest());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(1);
    expect(data[0].visibility).toBe("public");
  });

  it("admin sees all tournaments", async () => {
    mockIsAdmin.mockResolvedValue(true);
    mockGetPlayerId.mockResolvedValue(null);
    mockSql.query.mockResolvedValue({
      rows: [
        { id: "t-1", name: "Public", visibility: "public", tournament_type: "official" },
        { id: "t-2", name: "Private", visibility: "private", tournament_type: "casual" },
      ],
    });

    const res = await GET(makeGetRequest());
    const data = await res.json();
    expect(data).toHaveLength(2);
  });
});

describe("POST /api/tournaments — player creates casual", () => {
  it("unauthenticated cannot create", async () => {
    mockIsAdmin.mockResolvedValue(false);
    mockGetPlayerId.mockResolvedValue(null);

    const res = await POST(
      makePostRequest({ name: "My Game", date: "2026-05-01", courseId: "test-course", teeName: "Blue", format: "stroke_play" }),
    );
    expect(res.status).toBe(401);
  });

  it("player creates casual tournament", async () => {
    mockIsAdmin.mockResolvedValue(false);
    mockGetPlayerId.mockResolvedValue("p-1");
    mockSql
      .mockResolvedValueOnce({
        rows: [{ id: "t-new", name: "My Game", tournament_type: "casual", visibility: "private", creator_id: "p-1" }],
      }) // insert tournament
      .mockResolvedValueOnce({ rows: [] }); // insert organizer

    const res = await POST(
      makePostRequest({
        name: "My Game",
        date: "2026-05-01",
        courseId: "test-course",
        teeName: "Blue",
        format: "stroke_play",
        visibility: "private",
      }),
    );

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.tournamentType).toBe("casual");
    expect(data.creatorId).toBe("p-1");
  });

  it("player cannot create official tournament", async () => {
    mockIsAdmin.mockResolvedValue(false);
    mockGetPlayerId.mockResolvedValue("p-1");
    mockSql
      .mockResolvedValueOnce({
        rows: [{ id: "t-new", name: "Sneaky", tournament_type: "casual", visibility: "public", creator_id: "p-1" }],
      })
      .mockResolvedValueOnce({ rows: [] });

    const res = await POST(
      makePostRequest({
        name: "Sneaky",
        date: "2026-05-01",
        courseId: "test-course",
        teeName: "Blue",
        format: "stroke_play",
        tournamentType: "official", // should be forced to casual
      }),
    );

    expect(res.status).toBe(201);
    const data = await res.json();
    // Player's tournament is always casual regardless of what they pass
    expect(data.tournamentType).toBe("casual");
  });
});
