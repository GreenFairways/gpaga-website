/**
 * Score adjustment utilities (WHS Rule 3.1 — Net Double Bogey).
 *
 * These functions cap hole scores, distribute handicap strokes,
 * and produce the Adjusted Gross Score used for differential calculation.
 */

/**
 * Distribute a Course Handicap across 18 holes by Stroke Index.
 *
 * Positive CH: strokes are allocated starting from lowest SI.
 *   base = floor(CH / 18), extra = CH % 18.
 *   Holes with SI <= extra get base + 1, the rest get base.
 *
 * Negative CH: strokes are subtracted starting from highest SI.
 *   base = ceil(CH / 18) (negative), extra = abs(CH) % 18.
 *   Holes with SI <= extra get base - 1, the rest get base.
 */
export function calcStrokesPerHole(
  courseHandicap: number,
  holes: { strokeIndex: number }[],
): number[] {
  if (courseHandicap >= 0) {
    const base = Math.floor(courseHandicap / 18);
    const extra = courseHandicap % 18;
    return holes.map((h) => (h.strokeIndex <= extra ? base + 1 : base));
  }

  // Negative handicap — subtract strokes from highest SI first
  const absCH = Math.abs(courseHandicap);
  const base = -Math.floor(absCH / 18);
  const extra = absCH % 18;

  // For negative CH the "extra" removals go to the highest SI values.
  // Holes whose SI > (18 - extra) lose an additional stroke.
  return holes.map((h) => (h.strokeIndex > 18 - extra ? base - 1 : base));
}

/**
 * Net Double Bogey — the maximum score a player may post on a hole.
 *
 * NDB = Par + 2 + Handicap Strokes received on that hole.
 */
export function calcNetDoubleBogey(par: number, handicapStrokes: number): number {
  return par + 2 + handicapStrokes;
}

/**
 * Apply Net Double Bogey adjustment to raw scores.
 *
 * Returns the per-hole adjusted scores and the Adjusted Gross Score (their sum).
 */
export function adjustScores(
  rawScores: number[],
  holes: { par: number; strokeIndex: number }[],
  courseHandicap: number,
): { adjustedScores: number[]; adjustedGross: number } {
  const strokesPerHole = calcStrokesPerHole(courseHandicap, holes);

  const adjustedScores = rawScores.map((score, i) => {
    const ndb = calcNetDoubleBogey(holes[i].par, strokesPerHole[i]);
    return Math.min(score, ndb);
  });

  const adjustedGross = adjustedScores.reduce((sum, s) => sum + s, 0);

  return { adjustedScores, adjustedGross };
}
