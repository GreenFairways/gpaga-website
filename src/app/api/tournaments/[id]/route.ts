import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { mapTournament } from "@/lib/db/mappers";
import { canManageTournament, isCreatorOrAdmin, canViewTournament } from "@/lib/auth/permissions";

/** GET /api/tournaments/[id] — get tournament details (respects visibility) */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { rows } = await sql`SELECT * FROM tournaments WHERE id = ${id}`;

  if (rows.length === 0) {
    return Response.json({ error: "Tournament not found" }, { status: 404 });
  }

  if (!(await canViewTournament(id))) {
    return Response.json({ error: "Tournament not found" }, { status: 404 });
  }

  return Response.json(mapTournament(rows[0]));
}

/** PATCH /api/tournaments/[id] — update tournament (admin or organizer) */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!(await canManageTournament(id))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Build dynamic update
  const fields: string[] = [];
  const values: unknown[] = [];

  const allowed = [
    "name", "date", "course_id", "tee_name", "gender", "format",
    "status", "max_players", "entry_fee_lari", "rules",
    "handicap_allowance", "flight_config", "divisions", "visibility",
  ];

  // Map camelCase to snake_case
  const camelToSnake: Record<string, string> = {
    courseId: "course_id",
    teeName: "tee_name",
    maxPlayers: "max_players",
    entryFeeLari: "entry_fee_lari",
    handicapAllowance: "handicap_allowance",
    flightConfig: "flight_config",
  };

  const jsonFields = new Set(["flight_config", "divisions"]);

  const allowedSet = new Set(allowed);

  for (const [key, value] of Object.entries(body)) {
    const dbKey = camelToSnake[key] || key;
    // Strict validation: only exact matches from allowed set, alphanumeric + underscore only
    if (allowedSet.has(dbKey) && /^[a-z_]+$/.test(dbKey)) {
      fields.push(dbKey);
      values.push(jsonFields.has(dbKey) ? JSON.stringify(value) : value);
    }
  }

  if (fields.length === 0) {
    return Response.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const setClauses = fields.map((f, i) => `${f} = $${i + 2}`).join(", ");
  const query = `UPDATE tournaments SET ${setClauses}, updated_at = NOW() WHERE id = $1 RETURNING *`;

  const { rows } = await sql.query(query, [id, ...values]);

  if (rows.length === 0) {
    return Response.json({ error: "Tournament not found" }, { status: 404 });
  }

  return Response.json(mapTournament(rows[0]));
}

/** DELETE /api/tournaments/[id] — delete tournament (admin or creator only) */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!(await isCreatorOrAdmin(id))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // CASCADE handles most cleanup, but scores need manual cleanup
  await sql`DELETE FROM scores WHERE registration_id IN (SELECT id FROM registrations WHERE tournament_id = ${id})`;
  await sql`DELETE FROM registrations WHERE tournament_id = ${id}`;
  await sql`DELETE FROM teams WHERE tournament_id = ${id}`;
  await sql`DELETE FROM tournament_organizers WHERE tournament_id = ${id}`;
  await sql`DELETE FROM tournament_invites WHERE tournament_id = ${id}`;
  await sql`DELETE FROM tournaments WHERE id = ${id}`;

  return Response.json({ deleted: true });
}
