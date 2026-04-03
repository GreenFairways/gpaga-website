/**
 * Scramble Strategy
 *
 * All players tee off, team selects best shot, all play from there.
 * One scorecard per team. Sort by net total ascending (lowest wins).
 *
 * Handicap formulas (defaults, overrideable):
 * - 2-ball: 35% lower CH + 15% higher CH
 * - 3-ball: 20% lowest + 15% middle + 10% highest
 * - 4-ball: 25% of sum of all CH (alternative: 10/20/30/40%)
 */

import type { LeaderboardEntry } from "@/lib/tournament/types";
import type { ScoringStrategy, ScoringInput, ScoreRow } from "../types";
import { assignPositions } from "../helpers/positions";

/** Default handicap percentages per team size (sorted best-to-worst) */
const DEFAULT_SCRAMBLE_PCT: Record<number, number[]> = {
  2: [0.35, 0.15],
  3: [0.20, 0.15, 0.10],
  4: [0.10, 0.20, 0.30, 0.40], // Ambrose system
};

/**
 * Calculate team handicap for scramble.
 *
 * @param courseHandicaps - Array of course handicaps, sorted ascending (best first)
 * @param percentages - Matching array of percentages per player
 */
export function calcScrambleTeamHandicap(
  courseHandicaps: number[],
  percentages?: number[],
): number {
  const sorted = [...courseHandicaps].sort((a, b) => a - b);
  const pct = percentages ?? DEFAULT_SCRAMBLE_PCT[sorted.length] ?? DEFAULT_SCRAMBLE_PCT[4]!;

  let teamHcp = 0;
  for (let i = 0; i < sorted.length; i++) {
    teamHcp += sorted[i] * (pct[i] ?? 0);
  }

  return Math.round(teamHcp);
}

export const scrambleStrategy: ScoringStrategy = {
  format: "scramble",
  isTeamFormat: true,

  computeLeaderboard(input: ScoringInput): LeaderboardEntry[] {
    const { scores, coursePar, teams, config } = input;
    const scrambleConfig = config && "teamSize" in config ? config : null;
    const percentages = scrambleConfig && "handicapPercentages" in scrambleConfig
      ? scrambleConfig.handicapPercentages
      : undefined;

    // In scramble, scores are per-team (team_id on score rows).
    // Group scores by teamId.
    const byTeam = new Map<string, {
      teamId: string;
      teamName: string;
      members: string[];
      playingHandicaps: number[];
      holes: Map<number, { raw: number }>;
    }>();

    for (const s of scores) {
      const teamId = s.teamId ?? s.registrationId; // fallback for compat
      if (!byTeam.has(teamId)) {
        const team = teams?.find((t) => t.id === teamId);
        byTeam.set(teamId, {
          teamId,
          teamName: team?.name ?? s.teamName ?? `Team ${teamId.slice(0, 6)}`,
          members: team?.members.map((m) => `${m.firstName} ${m.lastName}`) ?? [],
          playingHandicaps: team?.members.map((m) => m.playingHandicap ?? 0) ?? [],
          holes: new Map(),
        });
      }
      const entry = byTeam.get(teamId)!;
      // For scramble, each hole has one score (the team's best shot result)
      if (!entry.holes.has(s.holeNumber)) {
        entry.holes.set(s.holeNumber, { raw: s.rawScore });
      }
    }

    const entries: LeaderboardEntry[] = [];

    for (const [, data] of byTeam) {
      let grossTotal = 0;
      let holesCompleted = 0;
      let thru = 0;
      const holeScores: (number | null)[] = Array(18).fill(null);

      for (const [holeNum, holeData] of data.holes) {
        grossTotal += holeData.raw;
        holesCompleted++;
        if (holeNum > thru) thru = holeNum;
        holeScores[holeNum - 1] = holeData.raw;
      }

      const teamHandicap = calcScrambleTeamHandicap(
        data.playingHandicaps,
        percentages,
      );
      const netTotal = grossTotal - teamHandicap;
      const toPar = netTotal - coursePar;

      entries.push({
        position: 0,
        tied: false,
        playerId: data.teamId, // use teamId as identifier
        playerName: data.teamName,
        handicapIndex: teamHandicap,
        playingHandicap: teamHandicap,
        holesCompleted,
        grossTotal,
        netTotal,
        toPar,
        stablefordTotal: null,
        thru,
        holeScores,
        status: "active",
        teamId: data.teamId,
        teamName: data.teamName,
        teamMembers: data.members,
      });
    }

    return assignPositions(
      entries,
      (a, b) => {
        if (a.netTotal !== b.netTotal) return a.netTotal - b.netTotal;
        return 0;
      },
      "scramble",
    );
  },
};
