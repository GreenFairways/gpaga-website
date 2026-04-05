import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { isAdmin } from "@/lib/auth/session";
import { mapTournament } from "@/lib/db/mappers";

/** GET /api/tournaments/[id] — get tournament details */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { rows } = await sql`SELECT * FROM tournaments WHERE id = ${id}`;

  if (rows.length === 0) {
    return Response.json({ error: "Tournament not found" }, { status: 404 });
  }

  return Response.json(mapTournament(rows[0]));
}

/** PATCH /api/tournaments/[id] — update tournament (admin only) */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  // Build dynamic update
  const fields: string[] = [];
  const values: unknown[] = [];

  const allowed = [
    "name", "date", "course_id", "tee_name", "gender", "format",
    "status", "max_players", "entry_fee_lari", "rules",
    "handicap_allowance", "flight_config", "divisions",
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

  for (const [key, value] of Object.entries(body)) {
    const dbKey = camelToSnake[key] || key;
    if (allowed.includes(dbKey)) {
      fields.push(dbKey);
      values.push(dbKey === "flight_config" || dbKey === "divisions" ? JSON.stringify(value) : value);
    }
  }

  if (fields.length === 0) {
    return Response.json({ error: "No valid fields to update" }, { status: 400 });
  }

  // Build SET clause dynamically since sql template doesn't support dynamic column names
  const setClauses = fields.map((f, i) => `${f} = $${i + 2}`).join(", ");
  const query = `UPDATE tournaments SET ${setClauses}, updated_at = NOW() WHERE id = $1 RETURNING *`;

  const { rows } = await sql.query(query, [id, ...values]);

  if (rows.length === 0) {
    return Response.json({ error: "Tournament not found" }, { status: 404 });
  }

  return Response.json(mapTournament(rows[0]));
}

/** DELETE /api/tournaments/[id] — delete tournament and all related data (admin only) */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Delete in order: scores → registrations → teams → tournament
  await sql`DELETE FROM scores WHERE registration_id IN (SELECT id FROM registrations WHERE tournament_id = ${id})`;
  await sql`DELETE FROM registrations WHERE tournament_id = ${id}`;
  await sql`DELETE FROM teams WHERE tournament_id = ${id}`;
  await sql`DELETE FROM tournaments WHERE id = ${id}`;

  return Response.json({ deleted: true });
}
