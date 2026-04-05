import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuthenticatedPlayerId } from "@/lib/auth/player-session";

/** GET /api/invites/[code] — resolve invite code to tournament info (public) */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;

  const { rows } = await sql`
    SELECT i.*, t.name AS tournament_name, t.date AS tournament_date,
           p.first_name AS inviter_first, p.last_name AS inviter_last
    FROM tournament_invites i
    JOIN tournaments t ON t.id = i.tournament_id
    JOIN players p ON p.id = i.invited_by
    WHERE i.invite_code = ${code}
  `;

  if (rows.length === 0) {
    return Response.json({ error: "Invite not found" }, { status: 404 });
  }

  const row = rows[0];
  return Response.json({
    tournamentId: row.tournament_id,
    tournamentName: row.tournament_name,
    tournamentDate: row.tournament_date instanceof Date
      ? row.tournament_date.toISOString().split("T")[0]
      : row.tournament_date,
    inviterName: `${row.inviter_first} ${row.inviter_last}`,
    status: row.status,
  });
}

/** POST /api/invites/[code] — accept invite via share link (player must be authenticated) */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const playerId = await getAuthenticatedPlayerId();

  if (!playerId) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { rows } = await sql`
    SELECT * FROM tournament_invites
    WHERE invite_code = ${code} AND status = 'pending'
  `;

  if (rows.length === 0) {
    return Response.json({ error: "Invite not found or already used" }, { status: 404 });
  }

  const invite = rows[0];

  // If invite is for a specific player, verify it matches
  if (invite.invited_player_id && invite.invited_player_id !== playerId) {
    return Response.json({ error: "This invite is for another player" }, { status: 403 });
  }

  // Link invite to this player if it was email-only
  await sql`
    UPDATE tournament_invites
    SET status = 'accepted', invited_player_id = ${playerId}, responded_at = NOW()
    WHERE id = ${invite.id}
  `;

  // Auto-register
  const { rows: existing } = await sql`
    SELECT 1 FROM registrations
    WHERE tournament_id = ${invite.tournament_id} AND player_id = ${playerId}
  `;

  if (existing.length === 0) {
    const { generateAccessCode, calcRegistrationHandicap } = await import("@/lib/tournament/registration");
    const { assignDivision, getTeeForPlayer } = await import("@/lib/tournament/divisions");

    const { rows: tRows } = await sql`SELECT * FROM tournaments WHERE id = ${invite.tournament_id}`;
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
        VALUES (${invite.tournament_id}, ${playerId}, ${hi}, ${courseHandicap}, ${playingHandicap}, ${divisionLabel}, ${accessCode})
      `;
    }
  }

  return Response.json({ ok: true, tournamentId: invite.tournament_id });
}
