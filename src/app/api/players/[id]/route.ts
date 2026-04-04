import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { isAdmin } from "@/lib/auth/session";
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

/** PATCH /api/players/[id] — update player fields (admin only) */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const { rows: existing } = await sql`SELECT * FROM players WHERE id = ${id}`;
  if (existing.length === 0) {
    return Response.json({ error: "Player not found" }, { status: 404 });
  }

  const {
    firstName,
    lastName,
    email,
    phone,
    gender,
    handicapIndex,
    handicapSource,
    homeClub,
    amgolfPeopleId,
    dateOfBirth,
  } = body;

  const { rows } = await sql`
    UPDATE players SET
      first_name = COALESCE(${firstName ?? null}, first_name),
      last_name = COALESCE(${lastName ?? null}, last_name),
      email = COALESCE(${email ?? null}, email),
      phone = COALESCE(${phone ?? null}, phone),
      gender = COALESCE(${gender ?? null}, gender),
      handicap_index = COALESCE(${handicapIndex ?? null}, handicap_index),
      handicap_source = COALESCE(${handicapSource ?? null}, handicap_source),
      home_club = COALESCE(${homeClub ?? null}, home_club),
      amgolf_people_id = COALESCE(${amgolfPeopleId ?? null}, amgolf_people_id),
      date_of_birth = COALESCE(${dateOfBirth ?? null}, date_of_birth)
    WHERE id = ${id}
    RETURNING *
  `;

  return Response.json(mapPlayer(rows[0]));
}
