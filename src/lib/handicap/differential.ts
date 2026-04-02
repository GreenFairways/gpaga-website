import { STANDARD_SLOPE } from "./constants";

/**
 * Calculate a Score Differential for an 18-hole round.
 *
 * Formula (WHS Rule 5.1):
 *   (113 / Slope Rating) × (Adjusted Gross Score − Course Rating − PCC)
 *
 * Result is truncated to one decimal place.
 */
export function calcScoreDifferential(
  adjustedGross: number,
  courseRating: number,
  slopeRating: number,
  pcc: number = 0,
): number {
  const raw =
    (STANDARD_SLOPE / slopeRating) * (adjustedGross - courseRating - pcc);
  return Math.trunc(raw * 10) / 10;
}
