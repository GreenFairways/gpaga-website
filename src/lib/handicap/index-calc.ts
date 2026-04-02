import { getDifferentialSelection, INDEX_MULTIPLIER, MAX_HANDICAP_INDEX } from "./constants";
import { applySafeguards } from "./safeguards";
import type { HandicapResult } from "./types";

/**
 * Calculate the Handicap Index from a set of 18-hole differentials
 * (WHS Rules 5.2 — 5.8).
 *
 * Steps:
 *   1. Require at least 3 differentials.
 *   2. Look up how many best differentials to use + adjustment.
 *   3. Sort ascending, take the best N.
 *   4. Average × 0.96 + adjustment.
 *   5. Truncate to one decimal.
 *   6. Apply soft / hard caps using lowIndex.
 *   7. Cap at 54.0.
 */
export function calcHandicapIndex(
  differentials: number[],
  lowIndex: number | null = null,
): HandicapResult | null {
  const available = differentials.length;

  const selection = getDifferentialSelection(available);
  if (!selection) return null; // fewer than 3 differentials

  const { count, adjustment } = selection;

  const sorted = [...differentials].sort((a, b) => a - b);
  const best = sorted.slice(0, count);

  const rawAverage = best.reduce((sum, d) => sum + d, 0) / count;
  const rawIndex = rawAverage * INDEX_MULTIPLIER + adjustment;
  const truncatedIndex = Math.trunc(rawIndex * 10) / 10;

  // Safeguards
  const { finalIndex, softCapApplied, hardCapApplied } = applySafeguards(
    truncatedIndex,
    lowIndex,
  );

  // Final cap
  const index = Math.min(finalIndex, MAX_HANDICAP_INDEX);

  return {
    index,
    differentialsUsed: count,
    differentialsAvailable: available,
    adjustment,
    rawAverage,
    softCapApplied,
    hardCapApplied,
    lowIndex,
  };
}
