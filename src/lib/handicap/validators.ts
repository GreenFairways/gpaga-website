/**
 * Input validation helpers for score entry.
 *
 * Each validator returns `null` when the input is valid,
 * or a human-readable error message string otherwise.
 */

/**
 * Validate a single hole score.
 */
export function validateHoleScore(score: number, par: number): string | null {
  if (typeof score !== "number" || Number.isNaN(score)) {
    return "Score must be a number";
  }
  if (!Number.isInteger(score)) {
    return "Score must be a whole number";
  }
  if (score < 1) {
    return "Score must be at least 1";
  }
  // par is accepted for future validation extensions but not constrained here
  void par;
  return null;
}

/**
 * Validate a full set of round scores.
 */
export function validateRoundScores(
  scores: number[],
  expectedHoles: number,
): string | null {
  if (!Array.isArray(scores)) {
    return "Scores must be an array";
  }
  if (scores.length !== expectedHoles) {
    return `Expected ${expectedHoles} scores but received ${scores.length}`;
  }
  for (let i = 0; i < scores.length; i++) {
    const err = validateHoleScore(scores[i], 0);
    if (err) {
      return `Hole ${i + 1}: ${err}`;
    }
  }
  return null;
}
