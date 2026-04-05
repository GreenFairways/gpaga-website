import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuthenticatedPlayerId } from "@/lib/auth/player-session";
import { mapInvite } from "@/lib/db/mappers";

/** PATCH /api/tournaments/[id]/invites/[inviteId] — accept or decline invite */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; inviteId: string }> },
) {
  const { id: tournamentId, inviteId } = await params;
  const playerId = await getAuthenticatedPlayerId();

  if (!playerId) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { action } = body as { action: "accept" | "decline" };

  if (!["accept", "decline"].includes(action)) {
    return Response.json({ error: "Action must be accept or decline" }, { status: 400 });
  }

  // Verify invite belongs to this player and tournament
  const { rows: invites } = await sql`
    SELECT * FROM tournament_invites
    WHERE id = ${inviteId}
      AND tournament_id = ${tournamentId}
      AND invited_player_id = ${playerId}
      AND status = 'pending'
  `;

  if (invites.length === 0) {
    return Response.json({ error: "Invite not found or already responded" }, { status: 404 });
  }

  const newStatus = action === "accept" ? "accepted" : "declined";

  await sql`
    UPDATE tournament_invites
    SET status = ${newStatus}, responded_at = NOW()
    WHERE id = ${inviteId}
  `;

  // If accepted, auto-register the player
  if (action === "accept") {
    // Check if already registered
    const { rows: existing } = await sql`
      SELECT 1 FROM registrations
      WHERE tournament_id = ${tournamentId} AND player_id = ${playerId}
    `;

    if (existing.length === 0) {
      // Import registration logic inline to avoid circular deps
      const { generateAccessCode, calcRegistrationHandicap } = await import("@/lib/tournament/registration");
      const { assignDivision, getTeeForPlayer } = await import("@/lib/tournament/divisions");

      const { rows: tRows } = await sql`SELECT * FROM tournaments WHERE id = ${tournamentId}`;
      const { rows: pRows } = await sql`SELECT * FROM players WHERE id = ${playerId}`;

      if (tRows.length > 0 && pRows.length > 0) {
        const tournament = tRows[0];
        const player = pRows[0];
        const hi = player.handicap_index != null ? parseFloat(player.handicap_index) : null;
        const gender = player.gender as "M" | "F";
        const dob = player.date_of_birth instanceof Date
          ? player.date_of_birth.toISOString().split("T")[0]
          : player.date_of_birth || null;
        const tournamentDate = tournament.date instanceof Date
          ? tournament.date.toISOString().split("T")[0]
          : tournament.date;

        const divisions = tournament.divisions as import("@/lib/tournament/types").Division[] | null;
        let divisionLabel: string | null = null;
        let teeName = tournament.tee_name;

        if (divisions && divisions.length > 0 && hi != null) {
          const div = assignDivision(divisions, hi);
          if (div) {
            divisionLabel = div.label;
            teeName = getTeeForPlayer(div, gender, dob, tournamentDate);
          }
        }

        const { courseHandicap, playingHandicap } = calcRegistrationHandicap(
          hi, tournament.course_id, teeName, gender,
          parseFloat(tournament.handicap_allowance),
        );

        const accessCode = generateAccessCode();

        await sql`
          INSERT INTO registrations (tournament_id, player_id, handicap_index_at_reg, course_handicap, playing_handicap, division_label, access_code)
          VALUES (${tournamentId}, ${playerId}, ${hi}, ${courseHandicap}, ${playingHandicap}, ${divisionLabel}, ${accessCode})
        `;
      }
    }
  }

  const { rows: updated } = await sql`SELECT * FROM tournament_invites WHERE id = ${inviteId}`;
  return Response.json(mapInvite(updated[0]));
}
