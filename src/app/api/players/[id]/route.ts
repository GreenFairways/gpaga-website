import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { isAdmin } from "@/lib/auth/session";
import { getAuthenticatedPlayerId } from "@/lib/auth/player-session";
import { mapPlayer } from "@/lib/db/mappers";

/** GET /api/players/[id] — get player details with tournament history */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const { rows } = await sql`SELECT * FROM players WHERE id = ${id}`;
  if (rows.length === 0) {
    return Response.json({ error: "Player not found" }, { status: 404 });
  }

  // Get tournament history
  const { rows: history } = await sql`
    SELECT
      r.tournament_id,
      t.name AS tournament_name,
      t.date AS tournament_date,
      t.format,
      r.playing_handicap,
      r.flight_number,
      r.status AS registration_status
    FROM registrations r
    JOIN tournaments t ON t.id = r.tournament_id
    WHERE r.player_id = ${id}
    ORDER BY t.date DESC
  `;

  return Response.json({
    ...mapPlayer(rows[0]),
    tournamentHistory: history.map((h) => ({
      tournamentId: h.tournament_id,
      tournamentName: h.tournament_name,
      date: h.tournament_date instanceof Date ? h.tournament_date.toISOString().split("T")[0] : h.tournament_date,
      format: h.format,
      playingHandicap: h.playing_handicap,
      flightNumber: h.flight_number,
      registrationStatus: h.registration_status,
    })),
  });
}

/** PATCH /api/players/[id] — update player fields (admin or self) */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const admin = await isAdmin();
  const authenticatedPlayerId = await getAuthenticatedPlayerId();

  if (!admin && authenticatedPlayerId !== id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();

  const { rows: existing } = await sql`SELECT * FROM players WHERE id = ${id}`;
  if (existing.length === 0) {
    return Response.json({ error: "Player not found" }, { status: 404 });
  }

  // Build SET clauses only for provided fields
  const fieldMap: Record<string, { column: string; value: unknown }> = {
    firstName: { column: "first_name", value: body.firstName },
    lastName: { column: "last_name", value: body.lastName },
    email: { column: "email", value: body.email },
    phone: { column: "phone", value: body.phone },
    gender: { column: "gender", value: body.gender },
    handicapIndex: { column: "handicap_index", value: body.handicapIndex },
    handicapSource: { column: "handicap_source", value: body.handicapSource },
    homeClub: { column: "home_club", value: body.homeClub },
    amgolfPeopleId: { column: "amgolf_people_id", value: body.amgolfPeopleId },
    dateOfBirth: { column: "date_of_birth", value: body.dateOfBirth },
  };

  const updates: { column: string; value: unknown }[] = [];
  for (const [key, entry] of Object.entries(fieldMap)) {
    if (key in body) updates.push(entry);
  }

  if (updates.length === 0) {
    return Response.json(mapPlayer(existing[0]));
  }

  // Apply updates one field at a time (Vercel Postgres tagged template limitation)
  for (const u of updates) {
    await sql.query(
      `UPDATE players SET ${u.column} = $1 WHERE id = $2`,
      [u.value, id],
    );
  }

  const { rows } = await sql`SELECT * FROM players WHERE id = ${id}`;
  return Response.json(mapPlayer(rows[0]));
}
