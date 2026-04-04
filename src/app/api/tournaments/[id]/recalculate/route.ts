import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { isAdmin } from "@/lib/auth/session";
import { calcRegistrationHandicap } from "@/lib/tournament/registration";
import { assignDivision, getTeeForPlayer } from "@/lib/tournament/divisions";
import { processHoleScore } from "@/lib/tournament/scoring";
import type { Division, TournamentFormat } from "@/lib/tournament/types";

/**
 * POST /api/tournaments/[id]/recalculate
 *
 * Recalculates playing handicap and all scores for registrations in a tournament.
 * Useful after fixing player data (gender, HI, date_of_birth).
 *
 * Body (optional): { playerIds?: string[] }
 * - If playerIds provided, only recalculate those players
 * - If omitted, recalculate ALL registrations
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: tournamentId } = await params;
  const body = await request.json().catch(() => ({}));
  const filterPlayerIds: string[] | undefined = body.playerIds;

  // Get tournament
  const { rows: tRows } = await sql`
    SELECT * FROM tournaments WHERE id = ${tournamentId}
  `;
  if (tRows.length === 0) {
    return Response.json({ error: "Tournament not found" }, { status: 404 });
  }
  const tournament = tRows[0];
  const divisions = (tournament.divisions as Division[]) || null;
  const tournamentDate =
    tournament.date instanceof Date
      ? tournament.date.toISOString().split("T")[0]
      : tournament.date;

  // Get registrations (optionally filtered)
  let regs;
  if (filterPlayerIds && filterPlayerIds.length > 0) {
    // Vercel Postgres doesn't support ANY(array), query all and filter
    const { rows } = await sql`
      SELECT r.*, p.gender, p.handicap_index, p.date_of_birth
      FROM registrations r
      JOIN players p ON p.id = r.player_id
      WHERE r.tournament_id = ${tournamentId}
    `;
    regs = rows.filter((r) => filterPlayerIds.includes(r.player_id));
  } else {
    const { rows } = await sql`
      SELECT r.*, p.gender, p.handicap_index, p.date_of_birth
      FROM registrations r
      JOIN players p ON p.id = r.player_id
      WHERE r.tournament_id = ${tournamentId}
    `;
    regs = rows;
  }

  const results: {
    playerName: string;
    oldPH: number;
    newPH: number;
    oldDiv: string | null;
    newDiv: string | null;
    scoresUpdated: number;
  }[] = [];

  for (const reg of regs) {
    const hi =
      reg.handicap_index != null ? parseFloat(reg.handicap_index) : null;
    const gender = reg.gender as "M" | "F";
    const dob =
      reg.date_of_birth instanceof Date
        ? reg.date_of_birth.toISOString().split("T")[0]
        : reg.date_of_birth || null;

    // Recalculate division + tee
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
      hi,
      tournament.course_id,
      teeName,
      gender,
      parseFloat(tournament.handicap_allowance),
    );

    const oldPH = parseInt(reg.playing_handicap) || 0;
    const newPH = playingHandicap ?? 0;
    const oldDiv = reg.division_label;
    const newDiv = divisionLabel;

    // Update registration
    await sql`
      UPDATE registrations
      SET playing_handicap = ${newPH},
          course_handicap = ${courseHandicap},
          division_label = ${newDiv}
      WHERE id = ${reg.id}
    `;

    // Recalculate all scores for this registration
    const { rows: scores } = await sql`
      SELECT * FROM scores WHERE registration_id = ${reg.id}
    `;

    // Determine score format
    let scoreFormat = tournament.format as TournamentFormat;
    if (divisions && newDiv) {
      const div = divisions.find((d) => d.label === newDiv);
      if (div) scoreFormat = div.format as TournamentFormat;
    }

    let scoresUpdated = 0;
    for (const score of scores) {
      const { adjustedScore, stablefordPoints } = processHoleScore(
        score.hole_number,
        score.raw_score,
        newPH,
        tournament.course_id,
        scoreFormat,
      );

      await sql`
        UPDATE scores
        SET adjusted_score = ${adjustedScore},
            stableford_points = ${stablefordPoints}
        WHERE id = ${score.id}
      `;
      scoresUpdated++;
    }

    results.push({
      playerName: `${reg.player_id}`,
      oldPH,
      newPH,
      oldDiv: oldDiv,
      newDiv,
      scoresUpdated,
    });
  }

  const changed = results.filter((r) => r.oldPH !== r.newPH || r.oldDiv !== r.newDiv);

  return Response.json({
    total: results.length,
    changed: changed.length,
    details: results,
  });
}
