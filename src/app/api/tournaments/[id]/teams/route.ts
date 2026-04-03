import type { NextRequest } from "next/server";
import { sql, initDatabase } from "@/lib/db";
import { isAdmin } from "@/lib/auth/session";
import { mapTeam } from "@/lib/db/mappers";

let dbInitialized = false;
async function ensureDb() {
  if (!dbInitialized) {
    await initDatabase();
    dbInitialized = true;
  }
}

/** GET /api/tournaments/[id]/teams — list teams with members */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await ensureDb();
  const { id } = await params;

  const { rows: teamRows } = await sql`
    SELECT * FROM teams WHERE tournament_id = ${id} ORDER BY seed ASC NULLS LAST, name ASC
  `;

  const teams = teamRows.map(mapTeam);

  // Fetch members for all teams
  const { rows: memberRows } = await sql`
    SELECT
      r.id AS registration_id,
      r.team_id,
      r.playing_handicap,
      r.handicap_index_at_reg,
      p.id AS player_id,
      p.first_name,
      p.last_name,
      p.handicap_index
    FROM registrations r
    JOIN players p ON p.id = r.player_id
    WHERE r.tournament_id = ${id} AND r.team_id IS NOT NULL
    ORDER BY r.team_id, p.last_name
  `;

  const membersByTeam = new Map<string, typeof memberRows>();
  for (const m of memberRows) {
    const teamId = m.team_id;
    if (!membersByTeam.has(teamId)) membersByTeam.set(teamId, []);
    membersByTeam.get(teamId)!.push(m);
  }

  const result = teams.map((t) => ({
    ...t,
    members: (membersByTeam.get(t.id) || []).map((m) => ({
      registrationId: m.registration_id,
      playerId: m.player_id,
      firstName: m.first_name,
      lastName: m.last_name,
      handicapIndex: m.handicap_index != null ? parseFloat(m.handicap_index) : null,
      playingHandicap: m.playing_handicap != null ? parseInt(m.playing_handicap) : null,
    })),
  }));

  return Response.json(result);
}

/** POST /api/tournaments/[id]/teams — create a team */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await ensureDb();
  if (!(await isAdmin())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { name, seed } = body as { name: string; seed?: number };

  if (!name) {
    return Response.json({ error: "Team name is required" }, { status: 400 });
  }

  const { rows } = await sql`
    INSERT INTO teams (tournament_id, name, seed)
    VALUES (${id}, ${name}, ${seed ?? null})
    RETURNING *
  `;

  return Response.json(mapTeam(rows[0]), { status: 201 });
}
