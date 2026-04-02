import {
  SOFT_CAP_THRESHOLD,
  HARD_CAP_THRESHOLD,
  MAX_HANDICAP_INDEX,
} from "./constants";

/**
 * Apply Handicap Index safeguards (WHS Rule 5.8).
 *
 * - Soft cap: increases beyond lowIndex + 3.0 are reduced by 50 %.
 * - Hard cap: result cannot exceed lowIndex + 5.0.
 * - Final index is capped at 54.0.
 * - If lowIndex is null (new player), no caps are applied.
 */
export function applySafeguards(
  calculatedIndex: number,
  lowIndex: number | null,
): {
  finalIndex: number;
  softCapApplied: boolean;
  hardCapApplied: boolean;
} {
  let finalIndex = calculatedIndex;
  let softCapApplied = false;
  let hardCapApplied = false;

  if (lowIndex !== null) {
    const softLimit = lowIndex + SOFT_CAP_THRESHOLD;
    const hardLimit = lowIndex + HARD_CAP_THRESHOLD;

    if (finalIndex > softLimit) {
      // Reduce the excess above the soft limit by 50 %
      finalIndex = softLimit + (finalIndex - softLimit) * 0.5;
      softCapApplied = true;
    }

    if (finalIndex > hardLimit) {
      finalIndex = hardLimit;
      hardCapApplied = true;
    }
  }

  // Absolute maximum
  if (finalIndex > MAX_HANDICAP_INDEX) {
    finalIndex = MAX_HANDICAP_INDEX;
  }

  return { finalIndex, softCapApplied, hardCapApplied };
}
