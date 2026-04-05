import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { canManageTournament } from "@/lib/auth/permissions";
import { mapTeam } from "@/lib/db/mappers";

/** PATCH /api/tournaments/[id]/teams/[teamId] — update team */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; teamId: string }> },
) {
  const { id, teamId } = await params;

  if (!(await canManageTournament(id))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, seed, teamHandicap } = body as {
    name?: string;
    seed?: number;
    teamHandicap?: number;
  };

  const { rows } = await sql`
    UPDATE teams SET
      name = COALESCE(${name ?? null}, name),
      seed = COALESCE(${seed ?? null}, seed),
      team_handicap = COALESCE(${teamHandicap ?? null}, team_handicap)
    WHERE id = ${teamId}
    RETURNING *
  `;

  if (rows.length === 0) {
    return Response.json({ error: "Team not found" }, { status: 404 });
  }

  return Response.json(mapTeam(rows[0]));
}

/** DELETE /api/tournaments/[id]/teams/[teamId] — delete team */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; teamId: string }> },
) {
  const { id, teamId } = await params;

  if (!(await canManageTournament(id))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Remove team_id from registrations first
  await sql`UPDATE registrations SET team_id = NULL WHERE team_id = ${teamId}`;
  await sql`DELETE FROM teams WHERE id = ${teamId}`;

  return Response.json({ ok: true });
}
