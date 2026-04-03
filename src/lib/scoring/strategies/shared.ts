/**
 * Shared helpers for scoring strategies.
 */

import type { ScoreRow } from "../types";

export interface GroupedRegistration {
  playerId: string;
  playerName: string;
  handicapIndex: number | null;
  playingHandicap: number;
  teamId?: string;
  teamName?: string;
  holes: Map<number, { raw: number; adjusted: number; stableford: number | null }>;
}

/** Group score rows by registration ID. */
export function groupScoresByRegistration(
  scores: ScoreRow[],
): Map<string, GroupedRegistration> {
  const byReg = new Map<string, GroupedRegistration>();

  for (const s of scores) {
    if (!byReg.has(s.registrationId)) {
      byReg.set(s.registrationId, {
        playerId: s.playerId,
        playerName: `${s.firstName} ${s.lastName}`,
        handicapIndex: s.handicapIndex,
        playingHandicap: s.playingHandicap,
        teamId: s.teamId,
        teamName: s.teamName,
        holes: new Map(),
      });
    }
    byReg.get(s.registrationId)!.holes.set(s.holeNumber, {
      raw: s.rawScore,
      adjusted: s.adjustedScore,
      stableford: s.stablefordPoints,
    });
  }

  return byReg;
}
