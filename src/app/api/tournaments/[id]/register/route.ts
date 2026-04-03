import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { isAdmin } from "@/lib/auth/session";
import { mapRegistration } from "@/lib/db/mappers";
import {
  generateAccessCode,
  calcRegistrationHandicap,
} from "@/lib/tournament/registration";

/**
 * POST /api/tournaments/[id]/register
 *
 * Two modes:
 * 1. Admin: { playerId } — register an existing player by ID
 * 2. Member API: { memberToken } — authenticated member registers themselves (future mobile app)
 *
 * No public open registration with raw name/email fields.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: tournamentId } = await params;
  const body = await request.json();

  // Determine auth mode
  const admin = await isAdmin();
  const { playerId, memberToken } = body;

  if (!admin && !memberToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. Get tournament
  const { rows: tRows } = await sql`
    SELECT * FROM tournaments WHERE id = ${tournamentId}
  `;
  if (tRows.length === 0) {
    return Response.json({ error: "Tournament not found" }, { status: 404 });
  }
  const tournament = tRows[0];

  // Admin can register regardless of status; members only when open
  if (!admin && tournament.status !== "registration_open") {
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

  // 3. Resolve player
  let resolvedPlayerId: string;

  if (admin && playerId) {
    // Admin mode: register existing player by ID
    resolvedPlayerId = playerId;
  } else if (memberToken) {
    // Member mode: verify token and get player ID
    // For now, memberToken = player ID (will be replaced with JWT when member auth is built)
    // Future: verify JWT, extract player ID from claims
    resolvedPlayerId = memberToken;
  } else {
    return Response.json(
      { error: "playerId required (admin) or memberToken required (member)" },
      { status: 400 },
    );
  }

  // 4. Verify player exists
  const { rows: playerRows } = await sql`
    SELECT * FROM players WHERE id = ${resolvedPlayerId}
  `;
  if (playerRows.length === 0) {
    return Response.json({ error: "Player not found" }, { status: 404 });
  }
  const player = playerRows[0];

  // 5. Check for duplicate registration
  const { rows: existingReg } = await sql`
    SELECT id FROM registrations
    WHERE tournament_id = ${tournamentId} AND player_id = ${resolvedPlayerId}
  `;
  if (existingReg.length > 0) {
    return Response.json(
      { error: "Player is already registered for this tournament" },
      { status: 409 },
    );
  }

  // 6. Calculate handicap
  const hi = player.handicap_index != null ? parseFloat(player.handicap_index) : null;
  const { courseHandicap, playingHandicap } = calcRegistrationHandicap(
    hi,
    tournament.course_id,
    tournament.tee_name,
    player.gender,
    parseFloat(tournament.handicap_allowance),
  );

  // 7. Create registration
  const accessCode = generateAccessCode();
  const { rows: regRows } = await sql`
    INSERT INTO registrations (tournament_id, player_id, handicap_index_at_reg, course_handicap, playing_handicap, access_code)
    VALUES (${tournamentId}, ${resolvedPlayerId}, ${hi}, ${courseHandicap}, ${playingHandicap}, ${accessCode})
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
