import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { isAdmin } from "@/lib/auth/session";
import { getAuthenticatedPlayerId } from "@/lib/auth/player-session";
import { canManageTournament } from "@/lib/auth/permissions";
import { mapRegistration } from "@/lib/db/mappers";
import {
  generateAccessCode,
  calcRegistrationHandicap,
} from "@/lib/tournament/registration";
import { getPlayer as getAmGolfPlayer } from "@/lib/amgolf";
import { assignDivision, getTeeForPlayer } from "@/lib/tournament/divisions";
import type { Division } from "@/lib/tournament/types";

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
  const authenticatedPlayerId = await getAuthenticatedPlayerId();
  const { playerId, memberToken, guestFirstName, guestLastName, guestGender } = body;

  if (!admin && !authenticatedPlayerId && !memberToken) {
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

  // Admin/organizer can register regardless of status; players only when open
  const organizer = await canManageTournament(tournamentId);
  if (!admin && !organizer && tournament.status !== "registration_open") {
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

  if ((admin || organizer) && guestFirstName && guestLastName) {
    // Guest mode: create a player record without an account
    const gender = guestGender || "M";
    const { rows: guestRows } = await sql`
      INSERT INTO players (first_name, last_name, gender)
      VALUES (${guestFirstName.trim()}, ${guestLastName.trim()}, ${gender})
      RETURNING id
    `;
    resolvedPlayerId = guestRows[0].id;
  } else if ((admin || organizer) && playerId) {
    // Admin/organizer mode: register existing player by ID
    resolvedPlayerId = playerId;
  } else if (authenticatedPlayerId && !playerId) {
    // Player self-registration
    resolvedPlayerId = authenticatedPlayerId;
  } else if (memberToken) {
    // Legacy member mode: memberToken = player ID
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

  // 5. Auto-refresh HI from AmGolf if linked
  if (player.amgolf_people_id) {
    try {
      const amgolf = await getAmGolfPlayer(player.amgolf_people_id);
      if (amgolf.exactHandicap != null) {
        const freshHI = amgolf.exactHandicap;
        const storedHI = player.handicap_index != null ? parseFloat(player.handicap_index) : null;
        if (freshHI !== storedHI) {
          await sql`
            UPDATE players SET handicap_index = ${freshHI}, handicap_source = 'amgolf'
            WHERE id = ${resolvedPlayerId}
          `;
          player.handicap_index = freshHI;
        }
      }
    } catch {
      // AmGolf API failure should not block registration
    }
  }

  // 6. Assign division + determine tee
  const hi = player.handicap_index != null ? parseFloat(player.handicap_index) : null;
  const divisions = (tournament.divisions as Division[]) || null;
  let divisionLabel: string | null = null;
  let teeName: string;

  if (divisions && divisions.length > 0 && hi != null) {
    // Official tournament with divisions — use division tee rules
    teeName = tournament.tee_name;
    const div = assignDivision(divisions, hi);
    if (div) {
      divisionLabel = div.label;
      const dob = player.date_of_birth instanceof Date
        ? player.date_of_birth.toISOString().split("T")[0]
        : player.date_of_birth || null;
      teeName = getTeeForPlayer(div, player.gender, dob, tournament.date instanceof Date
        ? tournament.date.toISOString().split("T")[0]
        : tournament.date);
    }
  } else {
    // Casual game / no divisions — use club default tees by gender
    const { getCourseInfo } = await import("@/data/courses/info");
    const courseInfo = getCourseInfo(tournament.course_id);
    const gender = player.gender === "F" ? "F" : "M";
    teeName = courseInfo?.defaultTees?.[gender] || tournament.tee_name;
  }

  const { courseHandicap, playingHandicap } = calcRegistrationHandicap(
    hi,
    tournament.course_id,
    teeName,
    player.gender,
    parseFloat(tournament.handicap_allowance),
  );

  // 7. Create registration (atomic duplicate check via unique constraint)
  const accessCode = generateAccessCode();
  try {
    const { rows: regRows } = await sql`
      INSERT INTO registrations (tournament_id, player_id, handicap_index_at_reg, course_handicap, playing_handicap, tee_name, division_label, access_code)
      VALUES (${tournamentId}, ${resolvedPlayerId}, ${hi}, ${courseHandicap}, ${playingHandicap}, ${teeName}, ${divisionLabel}, ${accessCode})
      RETURNING *
    `;

    return Response.json(
      {
        ...mapRegistration(regRows[0]),
        playerName: `${player.first_name} ${player.last_name}`,
        divisionLabel,
        accessCode,
      },
      { status: 201 },
    );
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("duplicate key")) {
      return Response.json(
        { error: "Player is already registered for this tournament" },
        { status: 409 },
      );
    }
    throw err;
  }
}
