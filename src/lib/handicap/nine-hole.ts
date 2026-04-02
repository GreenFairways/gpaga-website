import type { RoundScore } from "./types";

/**
 * Combine two 9-hole differentials into one 18-hole equivalent
 * (WHS Rule 5.1b).
 *
 * Simply adds the two differentials together.
 */
export function combineNineHoleDifferentials(
  diff1: number,
  diff2: number,
): number {
  return diff1 + diff2;
}

/**
 * Build the effective list of 18-hole differentials from a mix of
 * 18-hole and 9-hole rounds.
 *
 * - 18-hole rounds contribute their scoreDifferential directly.
 * - 9-hole rounds are paired chronologically (by date, then array order).
 *   The first unpaired 9 pairs with the next unpaired 9.
 * - Any leftover unpaired 9-hole round is excluded.
 *
 * Returns the differentials array and the IDs of paired 9-hole rounds.
 */
export function buildEffectiveDifferentials(
  rounds: RoundScore[],
): {
  differentials: number[];
  pairedRoundIds: [string, string][];
} {
  const differentials: number[] = [];
  const pairedRoundIds: [string, string][] = [];

  // Separate 18-hole and 9-hole rounds
  const nineHoleRounds: RoundScore[] = [];

  for (const round of rounds) {
    if (!round.isNineHole) {
      differentials.push(round.scoreDifferential);
    } else {
      nineHoleRounds.push(round);
    }
  }

  // Sort 9-hole rounds chronologically (stable: preserves array order for same date)
  nineHoleRounds.sort((a, b) => a.date.localeCompare(b.date));

  // Pair consecutive 9-hole rounds
  for (let i = 0; i + 1 < nineHoleRounds.length; i += 2) {
    const r1 = nineHoleRounds[i];
    const r2 = nineHoleRounds[i + 1];
    differentials.push(
      combineNineHoleDifferentials(r1.scoreDifferential, r2.scoreDifferential),
    );
    pairedRoundIds.push([r1.id, r2.id]);
  }

  return { differentials, pairedRoundIds };
}
