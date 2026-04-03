import { sql } from "@/lib/db";
import { computeOrderOfMerit } from "@/lib/tournament/merit";

/** GET /api/merit — Order of Merit standings */
export async function GET() {
  // Get final positions from completed tournaments
  // We compute positions from scores for each completed tournament
  const { rows: completedTournaments } = await sql`
    SELECT id, name, date, course_id, format
    FROM tournaments
    WHERE status = 'completed'
    ORDER BY date
  `;

  if (completedTournaments.length === 0) {
    return Response.json([]);
  }

  // For each completed tournament, get leaderboard positions
  const allResults: {
    tournamentId: string;
    tournamentName: string;
    tournamentDate: string;
    playerId: string;
    playerName: string;
    position: number;
  }[] = [];

  for (const t of completedTournaments) {
    // Get net totals per player for this tournament
    const { rows } = await sql`
      SELECT
        p.id AS player_id,
        p.first_name,
        p.last_name,
        r.playing_handicap,
        SUM(s.raw_score) AS gross_total,
        SUM(s.stableford_points) AS stableford_total
      FROM scores s
      JOIN registrations r ON r.id = s.registration_id
      JOIN players p ON p.id = r.player_id
      WHERE r.tournament_id = ${t.id}
      GROUP BY p.id, p.first_name, p.last_name, r.playing_handicap
      ORDER BY
        CASE WHEN ${t.format} = 'stableford' THEN -SUM(s.stableford_points)
             ELSE SUM(s.raw_score) - r.playing_handicap END
    `;

    rows.forEach((r, i) => {
      allResults.push({
        tournamentId: t.id,
        tournamentName: t.name,
        tournamentDate:
          t.date instanceof Date ? t.date.toISOString().split("T")[0] : t.date,
        playerId: r.player_id,
        playerName: `${r.first_name} ${r.last_name}`,
        position: i + 1,
      });
    });
  }

  const merit = computeOrderOfMerit(allResults);
  return Response.json(merit);
}
