import type { DifferentialSelection } from "./types";

/** Standard Slope Rating (neutral course difficulty) */
export const STANDARD_SLOPE = 113;

/** Maximum Handicap Index */
export const MAX_HANDICAP_INDEX = 54.0;

/** Multiplier applied to raw average (built-in reduction) */
export const INDEX_MULTIPLIER = 0.96;

/** Soft Cap: increases beyond this above low HI are reduced by 50% */
export const SOFT_CAP_THRESHOLD = 3.0;

/** Hard Cap: HI cannot exceed low HI + this value */
export const HARD_CAP_THRESHOLD = 5.0;

/**
 * Differential selection table.
 * Key = number of available 18-hole differentials (3-20+).
 * Value = { count: best N to use, adjustment: additional offset }.
 */
export const DIFFERENTIAL_TABLE: Record<number, DifferentialSelection> = {
  3: { count: 1, adjustment: -2.0 },
  4: { count: 1, adjustment: -1.0 },
  5: { count: 1, adjustment: 0 },
  6: { count: 2, adjustment: -1.0 },
  7: { count: 2, adjustment: 0 },
  8: { count: 2, adjustment: 0 },
  9: { count: 3, adjustment: 0 },
  10: { count: 3, adjustment: 0 },
  11: { count: 3, adjustment: 0 },
  12: { count: 4, adjustment: 0 },
  13: { count: 4, adjustment: 0 },
  14: { count: 4, adjustment: 0 },
  15: { count: 5, adjustment: 0 },
  16: { count: 5, adjustment: 0 },
  17: { count: 6, adjustment: 0 },
  18: { count: 6, adjustment: 0 },
  19: { count: 7, adjustment: 0 },
  20: { count: 8, adjustment: 0 },
};

/**
 * For 20+ differentials, always use best 8 with no adjustment.
 */
export function getDifferentialSelection(
  availableCount: number
): DifferentialSelection | null {
  if (availableCount < 3) return null;
  if (availableCount >= 20) return { count: 8, adjustment: 0 };
  return DIFFERENTIAL_TABLE[availableCount] ?? null;
}
