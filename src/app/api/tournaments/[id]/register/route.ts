import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { mapRegistration } from "@/lib/db/mappers";
import {
  generateAccessCode,
  calcRegistrationHandicap,
} from "@/lib/tournament/registration";

/** POST /api/tournaments/[id]/register — register a player for a tournament */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: tournamentId } = await params;
  const body = await request.json();

  // 1. Get tournament
  const { rows: tRows } = await sql`
    SELECT * FROM tournaments WHERE id = ${tournamentId}
  `;
  if (tRows.length === 0) {
    return Response.json({ error: "Tournament not found" }, { status: 404 });
  }
  const tournament = tRows[0];

  if (tournament.status !== "registration_open") {
    return Response.json(
      { error: "Registration is not open for this tournament" },
      { status: 400 },
    );
  }

  // 2. Check capacity
  const { rows: countRows } = await sql`
    SELECT COUNT(*) AS cnt FROM registrations
    WHERE tournament_id = ${tournamentId} AND status != 'withdrawn'
  `;
  if (parseInt(countRows[0].cnt) >= tournament.max_players) {
    return Response.json({ error: "Tournament is full" }, { status: 400 });
  }

  // 3. Upsert player
  const {
    firstName,
    lastName,
    email,
    phone = null,
    gender,
    handicapIndex = null,
    homeClub = null,
  } = body;

  if (!firstName || !lastName || !email || !gender) {
    return Response.json(
      { error: "Missing required fields: firstName, lastName, email, gender" },
      { status: 400 },
    );
  }

  const { rows: playerRows } = await sql`
    INSERT INTO players (first_name, last_name, email, phone, gender, handicap_index, home_club)
    VALUES (${firstName}, ${lastName}, ${email}, ${phone}, ${gender}, ${handicapIndex}, ${homeClub})
    ON CONFLICT (email) DO UPDATE SET
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      phone = COALESCE(EXCLUDED.phone, players.phone),
      handicap_index = COALESCE(EXCLUDED.handicap_index, players.handicap_index),
      home_club = COALESCE(EXCLUDED.home_club, players.home_club)
    RETURNING *
  `;
  const player = playerRows[0];

  // 4. Check for duplicate registration
  const { rows: existingReg } = await sql`
    SELECT id FROM registrations
    WHERE tournament_id = ${tournamentId} AND player_id = ${player.id}
  `;
  if (existingReg.length > 0) {
    return Response.json(
      { error: "Player is already registered for this tournament" },
      { status: 409 },
    );
  }

  // 5. Calculate handicap
  const hi = handicapIndex != null ? handicapIndex : parseFloat(player.handicap_index);
  const { courseHandicap, playingHandicap } = calcRegistrationHandicap(
    isNaN(hi) ? null : hi,
    tournament.course_id,
    tournament.tee_name,
    gender,
    parseFloat(tournament.handicap_allowance),
  );

  // 6. Create registration
  const accessCode = generateAccessCode();
  const { rows: regRows } = await sql`
    INSERT INTO registrations (tournament_id, player_id, handicap_index_at_reg, course_handicap, playing_handicap, access_code)
    VALUES (${tournamentId}, ${player.id}, ${isNaN(hi) ? null : hi}, ${courseHandicap}, ${playingHandicap}, ${accessCode})
    RETURNING *
  `;

  return Response.json(
    {
      ...mapRegistration(regRows[0]),
      playerName: `${player.first_name} ${player.last_name}`,
      accessCode,
    },
    { status: 201 },
  );
}
