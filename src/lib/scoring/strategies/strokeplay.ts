/**
 * Strokeplay (Net) Strategy
 *
 * Sort by net total ascending (lowest wins).
 * Tiebreak: lower handicap, then countback 9/6/3/1.
 */

import type { LeaderboardEntry } from "@/lib/tournament/types";
import type { ScoringStrategy, ScoringInput, ScoreRow } from "../types";
import { assignPositions } from "../helpers/positions";
import { groupScoresByRegistration } from "./shared";

export const strokeplayStrategy: ScoringStrategy = {
  format: "strokeplay",
  isTeamFormat: false,

  computeLeaderboard(input: ScoringInput): LeaderboardEntry[] {
    const entries = buildIndividualEntries(input.scores, input.coursePar, false);
    return assignPositions(
      entries,
      (a, b) => {
        if (a.netTotal !== b.netTotal) return a.netTotal - b.netTotal;
        return 0; // let tiebreak handle the rest
      },
      "strokeplay",
    );
  },
};

/** Build individual leaderboard entries from score rows. Shared with stableford. */
export function buildIndividualEntries(
  scores: ScoreRow[],
  coursePar: number,
  isStableford: boolean,
): LeaderboardEntry[] {
  const byReg = groupScoresByRegistration(scores);
  const entries: LeaderboardEntry[] = [];

  for (const [, data] of byReg) {
    let grossTotal = 0;
    let stablefordTotal = 0;
    let holesCompleted = 0;
    let thru = 0;
    const holeScores: (number | null)[] = Array(18).fill(null);

    for (const [holeNum, holeData] of data.holes) {
      grossTotal += holeData.raw;
      if (holeData.stableford != null) stablefordTotal += holeData.stableford;
      holesCompleted++;
      if (holeNum > thru) thru = holeNum;
      holeScores[holeNum - 1] = holeData.raw;
    }

    const netStrokeplay = grossTotal - data.playingHandicap;
    const toPar = netStrokeplay - coursePar;

    entries.push({
      position: 0,
      tied: false,
      playerId: data.playerId,
      playerName: data.playerName,
      handicapIndex: data.handicapIndex,
      playingHandicap: data.playingHandicap,
      holesCompleted,
      grossTotal,
      netTotal: netStrokeplay,
      toPar,
      stablefordTotal: isStableford ? stablefordTotal : null,
      thru,
      holeScores,
      status: "active",
    });
  }

  return entries;
}
