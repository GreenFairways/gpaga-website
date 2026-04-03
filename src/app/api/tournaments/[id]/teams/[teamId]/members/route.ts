import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { isAdmin } from "@/lib/auth/session";
import { calcScrambleTeamHandicap } from "@/lib/scoring/strategies/scramble";

/** POST /api/tournaments/[id]/teams/[teamId]/members — add player to team */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; teamId: string }> },
) {
  if (!(await isAdmin())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, teamId } = await params;
  const body = await request.json();
  const { registrationId } = body as { registrationId: string };

  if (!registrationId) {
    return Response.json({ error: "registrationId is required" }, { status: 400 });
  }

  // Verify registration belongs to this tournament
  const { rows: regRows } = await sql`
    SELECT id, playing_handicap FROM registrations
    WHERE id = ${registrationId} AND tournament_id = ${id}
  `;
  if (regRows.length === 0) {
    return Response.json({ error: "Registration not found in this tournament" }, { status: 404 });
  }

  // Assign to team
  await sql`
    UPDATE registrations SET team_id = ${teamId} WHERE id = ${registrationId}
  `;

  // Recalculate team handicap
  await recalcTeamHandicap(teamId);

  return Response.json({ ok: true });
}

/** DELETE /api/tournaments/[id]/teams/[teamId]/members — remove player from team */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; teamId: string }> },
) {
  if (!(await isAdmin())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { teamId } = await params;
  const body = await request.json();
  const { registrationId } = body as { registrationId: string };

  await sql`
    UPDATE registrations SET team_id = NULL WHERE id = ${registrationId} AND team_id = ${teamId}
  `;

  // Recalculate team handicap
  await recalcTeamHandicap(teamId);

  return Response.json({ ok: true });
}

/** Recalculate and store team handicap based on current members */
async function recalcTeamHandicap(teamId: string): Promise<void> {
  const { rows } = await sql`
    SELECT playing_handicap FROM registrations
    WHERE team_id = ${teamId} AND playing_handicap IS NOT NULL
  `;

  if (rows.length === 0) {
    await sql`UPDATE teams SET team_handicap = NULL WHERE id = ${teamId}`;
    return;
  }

  const handicaps = rows.map((r) => parseInt(r.playing_handicap));
  const teamHcp = calcScrambleTeamHandicap(handicaps);

  await sql`UPDATE teams SET team_handicap = ${teamHcp} WHERE id = ${teamId}`;
}
