import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { isCreatorOrAdmin } from "@/lib/auth/permissions";
import { mapOrganizer } from "@/lib/db/mappers";

/** GET /api/tournaments/[id]/organizers — list organizers */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const { rows } = await sql`
    SELECT o.*, p.first_name, p.last_name, p.email
    FROM tournament_organizers o
    JOIN players p ON p.id = o.player_id
    WHERE o.tournament_id = ${id}
    ORDER BY o.role, o.created_at
  `;

  return Response.json(
    rows.map((r) => ({
      ...mapOrganizer(r),
      playerName: `${r.first_name} ${r.last_name}`,
      email: r.email,
    })),
  );
}

/** POST /api/tournaments/[id]/organizers — add co-organizer (creator or admin only) */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!(await isCreatorOrAdmin(id))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { playerId } = await request.json();
  if (!playerId) {
    return Response.json({ error: "playerId required" }, { status: 400 });
  }

  // Check player exists
  const { rows: pRows } = await sql`SELECT 1 FROM players WHERE id = ${playerId}`;
  if (pRows.length === 0) {
    return Response.json({ error: "Player not found" }, { status: 404 });
  }

  // Check not already organizer
  const { rows: existing } = await sql`
    SELECT 1 FROM tournament_organizers
    WHERE tournament_id = ${id} AND player_id = ${playerId}
  `;
  if (existing.length > 0) {
    return Response.json({ error: "Already an organizer" }, { status: 409 });
  }

  const { rows } = await sql`
    INSERT INTO tournament_organizers (tournament_id, player_id, role)
    VALUES (${id}, ${playerId}, 'co_organizer')
    RETURNING *
  `;

  return Response.json(mapOrganizer(rows[0]), { status: 201 });
}

/** DELETE /api/tournaments/[id]/organizers — remove co-organizer (creator or admin only) */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!(await isCreatorOrAdmin(id))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { playerId } = await request.json();
  if (!playerId) {
    return Response.json({ error: "playerId required" }, { status: 400 });
  }

  // Cannot remove the creator
  const { rows: orgRows } = await sql`
    SELECT role FROM tournament_organizers
    WHERE tournament_id = ${id} AND player_id = ${playerId}
  `;
  if (orgRows.length > 0 && orgRows[0].role === "creator") {
    return Response.json({ error: "Cannot remove the creator" }, { status: 400 });
  }

  await sql`
    DELETE FROM tournament_organizers
    WHERE tournament_id = ${id} AND player_id = ${playerId} AND role != 'creator'
  `;

  return Response.json({ ok: true });
}
