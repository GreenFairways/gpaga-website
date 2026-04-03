import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { computeLeaderboard } from "@/lib/tournament/leaderboard";
import { getCourse } from "@/data/courses";
import type { TournamentFormat, Division } from "@/lib/tournament/types";

/** GET /api/tournaments/[id]/leaderboard — computed leaderboard, optionally per division */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Get tournament
  const { rows: tRows } = await sql`
    SELECT * FROM tournaments WHERE id = ${id}
  `;
  if (tRows.length === 0) {
    return Response.json({ error: "Tournament not found" }, { status: 404 });
  }
  const tournament = tRows[0];
  const course = getCourse(tournament.course_id);
  const coursePar = course?.par ?? 72;

  // Get all scores with player info + division
  const { rows } = await sql`
    SELECT
      s.registration_id AS "registrationId",
      p.id AS "playerId",
      p.first_name AS "firstName",
      p.last_name AS "lastName",
      r.handicap_index_at_reg AS "handicapIndex",
      r.playing_handicap AS "playingHandicap",
      r.division_label AS "divisionLabel",
      s.hole_number AS "holeNumber",
      s.raw_score AS "rawScore",
      s.adjusted_score AS "adjustedScore",
      s.stableford_points AS "stablefordPoints"
    FROM scores s
    JOIN registrations r ON r.id = s.registration_id
    JOIN players p ON p.id = r.player_id
    WHERE r.tournament_id = ${id}
    ORDER BY s.registration_id, s.hole_number
  `;

  const mapRow = (r: (typeof rows)[0]) => ({
    registrationId: r.registrationId,
    playerId: r.playerId,
    firstName: r.firstName,
    lastName: r.lastName,
    handicapIndex: r.handicapIndex != null ? parseFloat(r.handicapIndex) : null,
    playingHandicap: parseInt(r.playingHandicap) || 0,
    holeNumber: r.holeNumber,
    rawScore: r.rawScore,
    adjustedScore: r.adjustedScore,
    stablefordPoints: r.stablefordPoints,
  });

  const divisions = (tournament.divisions as Division[]) || null;

  if (divisions && divisions.length > 0) {
    // Per-division leaderboards
    const divisionLeaderboards = divisions.map((div) => {
      const divRows = rows.filter((r) => r.divisionLabel === div.label);
      return {
        division: div,
        entries: computeLeaderboard(divRows.map(mapRow), div.format, coursePar),
      };
    });

    return Response.json({
      tournamentId: id,
      format: tournament.format,
      coursePar,
      divisions: divisionLeaderboards,
      entries: null,
    });
  }

  // Legacy: single leaderboard
  const leaderboard = computeLeaderboard(
    rows.map(mapRow),
    tournament.format as TournamentFormat,
    coursePar,
  );

  return Response.json({
    tournamentId: id,
    format: tournament.format,
    coursePar,
    divisions: null,
    entries: leaderboard,
  });
}
