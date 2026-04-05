import { sql } from "@/lib/db";
import { getAuthenticatedPlayerId } from "@/lib/auth/player-session";
import { mapPlayer } from "@/lib/db/mappers";

/** GET /api/auth/me — get authenticated player's profile */
export async function GET() {
  const playerId = await getAuthenticatedPlayerId();
  if (!playerId) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { rows } = await sql`SELECT * FROM players WHERE id = ${playerId}`;
  if (rows.length === 0) {
    return Response.json({ error: "Player not found" }, { status: 404 });
  }

  return Response.json(mapPlayer(rows[0]));
}

/** PATCH /api/auth/me — update own profile fields */
export async function PATCH(request: Request) {
  const playerId = await getAuthenticatedPlayerId();
  if (!playerId) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();

  // Players can update these fields on their own profile
  const allowed: Record<string, string> = {
    phone: "phone",
    homeClub: "home_club",
    handicapIndex: "handicap_index",
    dateOfBirth: "date_of_birth",
  };

  const updates: { column: string; value: unknown }[] = [];
  for (const [key, column] of Object.entries(allowed)) {
    if (key in body) {
      updates.push({ column, value: body[key] });
    }
  }

  if (updates.length === 0) {
    return Response.json({ error: "No valid fields to update" }, { status: 400 });
  }

  for (const u of updates) {
    // Validate column name is safe (defense in depth)
    if (!/^[a-z_]+$/.test(u.column)) continue;
    await sql.query(
      `UPDATE players SET ${u.column} = $1 WHERE id = $2`,
      [u.value, playerId],
    );
  }

  const { rows } = await sql`SELECT * FROM players WHERE id = ${playerId}`;
  return Response.json(mapPlayer(rows[0]));
}
