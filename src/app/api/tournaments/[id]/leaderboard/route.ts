import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { computeLeaderboard } from "@/lib/scoring/engine";
import { getCourse } from "@/data/courses";
import { isTeamFormat } from "@/lib/tournament/types";
import type { TournamentFormat, Division, FormatConfig, Team, TeamMember } from "@/lib/tournament/types";

/** GET /api/tournaments/[id]/leaderboard */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const { rows: tRows } = await sql`
    SELECT * FROM tournaments WHERE id = ${id}
  `;
  if (tRows.length === 0) {
    return Response.json({ error: "Tournament not found" }, { status: 404 });
  }
  const tournament = tRows[0];
  const format = tournament.format as TournamentFormat;
  const course = getCourse(tournament.course_id);
  const coursePar = course?.par ?? 72;
  const formatConfig = (tournament.format_config as FormatConfig) || {};

  // Team format leaderboard
  if (isTeamFormat(format)) {
    return handleTeamLeaderboard(id, format, coursePar, formatConfig);
  }

  // Individual format (with or without divisions)
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
    const divisionLeaderboards = divisions.map((div) => {
      const divRows = rows.filter((r) => r.divisionLabel === div.label);
      return {
        division: div,
        entries: computeLeaderboard(divRows.map(mapRow), div.format, coursePar),
      };
    });

    return Response.json({
      tournamentId: id,
      format,
      coursePar,
      divisions: divisionLeaderboards,
      entries: null,
    });
  }

  const leaderboard = computeLeaderboard(rows.map(mapRow), format, coursePar);

  return Response.json({
    tournamentId: id,
    format,
    coursePar,
    divisions: null,
    entries: leaderboard,
  });
}

/** Handle team format leaderboard (scramble, best_ball, etc.) */
async function handleTeamLeaderboard(
  tournamentId: string,
  format: TournamentFormat,
  coursePar: number,
  formatConfig: FormatConfig,
) {
  // Get teams with members
  const { rows: teamRows } = await sql`
    SELECT * FROM teams WHERE tournament_id = ${tournamentId} ORDER BY name
  `;

  const { rows: memberRows } = await sql`
    SELECT
      r.id AS registration_id,
      r.team_id,
      r.playing_handicap,
      p.id AS player_id,
      p.first_name,
      p.last_name,
      p.handicap_index
    FROM registrations r
    JOIN players p ON p.id = r.player_id
    WHERE r.tournament_id = ${tournamentId} AND r.team_id IS NOT NULL
  `;

  const teams: (Team & { members: TeamMember[] })[] = teamRows.map((t) => ({
    id: t.id,
    tournamentId: t.tournament_id,
    name: t.name,
    teamHandicap: t.team_handicap != null ? parseFloat(t.team_handicap) : null,
    seed: t.seed,
    createdAt: t.created_at?.toISOString?.() || t.created_at,
    members: memberRows
      .filter((m) => m.team_id === t.id)
      .map((m) => ({
        registrationId: m.registration_id,
        playerId: m.player_id,
        firstName: m.first_name,
        lastName: m.last_name,
        handicapIndex: m.handicap_index != null ? parseFloat(m.handicap_index) : null,
        playingHandicap: m.playing_handicap != null ? parseInt(m.playing_handicap) : null,
      })),
  }));

  // Get team scores
  const { rows: scoreRows } = await sql`
    SELECT
      s.team_id AS "teamId",
      t.name AS "teamName",
      s.hole_number AS "holeNumber",
      s.raw_score AS "rawScore",
      s.adjusted_score AS "adjustedScore",
      s.registration_id AS "registrationId"
    FROM scores s
    JOIN teams t ON t.id = s.team_id
    WHERE s.team_id IN (
      SELECT id FROM teams WHERE tournament_id = ${tournamentId}
    )
    ORDER BY s.team_id, s.hole_number
  `;

  const mappedScores = scoreRows.map((r) => ({
    registrationId: r.registrationId,
    playerId: r.teamId, // use teamId as playerId for team formats
    firstName: r.teamName,
    lastName: "",
    handicapIndex: null,
    playingHandicap: 0,
    holeNumber: r.holeNumber,
    rawScore: r.rawScore,
    adjustedScore: r.adjustedScore,
    stablefordPoints: null,
    teamId: r.teamId,
    teamName: r.teamName,
  }));

  const leaderboard = computeLeaderboard(
    mappedScores,
    format,
    coursePar,
    formatConfig,
    teams,
  );

  return Response.json({
    tournamentId,
    format,
    coursePar,
    divisions: null,
    entries: leaderboard,
    teams,
  });
}
