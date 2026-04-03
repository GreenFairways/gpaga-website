/**
 * Leaderboard computation.
 *
 * Queries scores and registrations, computes positions with tie handling.
 */

import type { TournamentFormat, LeaderboardEntry } from "./types";

interface ScoreRow {
  registrationId: string;
  playerId: string;
  firstName: string;
  lastName: string;
  handicapIndex: number | null;
  playingHandicap: number;
  holeNumber: number;
  rawScore: number;
  adjustedScore: number;
  stablefordPoints: number | null;
}

/**
 * Build leaderboard from raw score rows.
 *
 * For strokeplay: sort by net total ascending (lowest wins).
 * For stableford: sort by stableford total descending (highest wins).
 */
export function computeLeaderboard(
  scores: ScoreRow[],
  format: TournamentFormat,
  coursePar: number,
): LeaderboardEntry[] {
  // Group scores by registration
  const byReg = new Map<
    string,
    {
      playerId: string;
      playerName: string;
      handicapIndex: number | null;
      playingHandicap: number;
      holes: Map<number, { raw: number; adjusted: number; stableford: number | null }>;
    }
  >();

  for (const s of scores) {
    if (!byReg.has(s.registrationId)) {
      byReg.set(s.registrationId, {
        playerId: s.playerId,
        playerName: `${s.firstName} ${s.lastName}`,
        handicapIndex: s.handicapIndex,
        playingHandicap: s.playingHandicap,
        holes: new Map(),
      });
    }
    byReg.get(s.registrationId)!.holes.set(s.holeNumber, {
      raw: s.rawScore,
      adjusted: s.adjustedScore,
      stableford: s.stablefordPoints,
    });
  }

  // Compute totals
  const entries: LeaderboardEntry[] = [];

  for (const [, data] of byReg) {
    let grossTotal = 0;
    let netTotal = 0;
    let stablefordTotal = 0;
    let holesCompleted = 0;
    let thru = 0;

    const holeScores: (number | null)[] = Array(18).fill(null);

    for (const [holeNum, holeData] of data.holes) {
      grossTotal += holeData.raw;
      netTotal += holeData.adjusted;
      if (holeData.stableford != null) stablefordTotal += holeData.stableford;
      holesCompleted++;
      if (holeNum > thru) thru = holeNum;
      holeScores[holeNum - 1] = holeData.raw;
    }

    // Net total for strokeplay: gross - playing handicap
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
      stablefordTotal: format === "stableford" ? stablefordTotal : null,
      thru,
      holeScores,
    });
  }

  // Sort
  if (format === "stableford") {
    entries.sort((a, b) => (b.stablefordTotal ?? 0) - (a.stablefordTotal ?? 0));
  } else {
    // Strokeplay: sort by net total ascending, then gross ascending for tie-break
    entries.sort((a, b) => {
      if (a.netTotal !== b.netTotal) return a.netTotal - b.netTotal;
      return a.grossTotal - b.grossTotal;
    });
  }

  // Assign positions with ties
  for (let i = 0; i < entries.length; i++) {
    if (i === 0) {
      entries[i].position = 1;
    } else {
      const prev = entries[i - 1];
      const curr = entries[i];
      const sameScore =
        format === "stableford"
          ? curr.stablefordTotal === prev.stablefordTotal
          : curr.netTotal === prev.netTotal;

      if (sameScore) {
        curr.position = prev.position;
        curr.tied = true;
        prev.tied = true;
      } else {
        curr.position = i + 1;
      }
    }
  }

  return entries;
}
