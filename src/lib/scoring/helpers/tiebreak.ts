/**
 * Tie-break logic.
 *
 * Default GPAGA rule (approved by Stas):
 * 1. Lower handicap index wins
 * 2. Countback: last 9 holes (10-18)
 * 3. Countback: last 6 holes (13-18)
 * 4. Countback: last 3 holes (16-18)
 * 5. Countback: hole 18
 * 6. Committee decision (return 0 = still tied)
 */

import type { LeaderboardEntry, TournamentFormat } from "@/lib/tournament/types";

/**
 * Compare two tied entries. Returns negative if `a` wins, positive if `b` wins, 0 if still tied.
 * Uses NET scores for countback (not gross).
 */
export function tieBreak(
  a: LeaderboardEntry,
  b: LeaderboardEntry,
  format: TournamentFormat,
): number {
  // Step 1: Lower handicap index wins
  const hiA = a.handicapIndex ?? 999;
  const hiB = b.handicapIndex ?? 999;
  if (hiA !== hiB) return hiA - hiB; // lower = better

  // Step 2-5: Countback on net scores
  // For stableford: higher points wins (so we compare b - a)
  // For strokeplay: lower net wins (so we compare a - b)
  const isStableford = format === "stableford";

  const countbackRanges = [
    [9, 18],   // last 9: holes 10-18
    [12, 18],  // last 6: holes 13-18
    [15, 18],  // last 3: holes 16-18
    [17, 18],  // hole 18
  ];

  for (const [start, end] of countbackRanges) {
    const sumA = sumHoles(a.holeScores, start, end);
    const sumB = sumHoles(b.holeScores, start, end);

    if (sumA === null || sumB === null) continue; // missing holes, skip
    if (sumA === sumB) continue;

    if (isStableford) {
      return sumB - sumA; // higher stableford points = better
    }
    return sumA - sumB; // lower strokes = better
  }

  return 0; // committee decision
}

/** Sum hole scores from index `start` to `end` (inclusive, 0-based). */
function sumHoles(
  holeScores: (number | null)[],
  start: number,
  end: number,
): number | null {
  let sum = 0;
  for (let i = start; i <= end && i < holeScores.length; i++) {
    if (holeScores[i] === null) return null;
    sum += holeScores[i]!;
  }
  return sum;
}
