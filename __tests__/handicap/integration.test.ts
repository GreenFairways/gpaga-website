import { describe, it, expect } from "vitest";
import { adjustScores } from "@/lib/handicap/adjustment";
import { calcScoreDifferential } from "@/lib/handicap/differential";
import { calcHandicapIndex } from "@/lib/handicap/index-calc";
import {
  calcCourseHandicap,
  calcPlayingHandicap,
} from "@/lib/handicap/course-handicap";

/**
 * Full integration test: raw scores → adjusted → differential → index → course handicap.
 *
 * Simulates a player with 5 rounds on a course with:
 *   CR = 71.0, Slope = 128, Par = 72
 */
describe("full handicap calculation flow", () => {
  const courseRating = 71.0;
  const slopeRating = 128;
  const par = 72;

  // 18 holes, pars match a typical course (par 72)
  const holes = [
    { par: 4, strokeIndex: 1 },
    { par: 4, strokeIndex: 3 },
    { par: 3, strokeIndex: 5 },
    { par: 5, strokeIndex: 7 },
    { par: 4, strokeIndex: 9 },
    { par: 4, strokeIndex: 11 },
    { par: 3, strokeIndex: 13 },
    { par: 5, strokeIndex: 15 },
    { par: 4, strokeIndex: 17 },
    { par: 5, strokeIndex: 2 },
    { par: 4, strokeIndex: 4 },
    { par: 3, strokeIndex: 6 },
    { par: 4, strokeIndex: 8 },
    { par: 4, strokeIndex: 10 },
    { par: 5, strokeIndex: 12 },
    { par: 3, strokeIndex: 14 },
    { par: 4, strokeIndex: 16 },
    { par: 4, strokeIndex: 18 },
  ];

  // Five rounds of raw scores (18 holes each)
  const rounds = [
    // Round 1: decent round, some blow-up holes
    [5, 5, 4, 6, 5, 5, 4, 7, 5, 6, 5, 4, 5, 5, 6, 4, 5, 5],
    // Round 2: better round
    [4, 5, 3, 6, 5, 4, 3, 6, 4, 6, 4, 3, 5, 4, 6, 3, 4, 5],
    // Round 3: rough day, several high scores
    [6, 7, 5, 8, 6, 6, 5, 9, 6, 7, 6, 5, 6, 7, 8, 5, 6, 7],
    // Round 4: average
    [5, 6, 4, 7, 5, 5, 4, 7, 5, 6, 5, 4, 5, 5, 7, 4, 5, 6],
    // Round 5: par-like round
    [4, 4, 3, 5, 4, 4, 3, 5, 4, 5, 4, 3, 4, 4, 5, 3, 4, 4],
  ];

  it("produces a valid handicap index from 5 rounds", () => {
    // Step 1: For each round, use a reasonable course handicap (say 18) to adjust scores
    const courseHandicap = 18; // initial estimate

    const differentials = rounds.map((rawScores) => {
      // Step 2: Adjust scores (NDB capping)
      const { adjustedGross } = adjustScores(rawScores, holes, courseHandicap);

      // Step 3: Calculate score differential
      return calcScoreDifferential(adjustedGross, courseRating, slopeRating, 0);
    });

    // All differentials should be numbers
    expect(differentials).toHaveLength(5);
    differentials.forEach((d) => {
      expect(typeof d).toBe("number");
      expect(d).toBeGreaterThanOrEqual(-10);
      expect(d).toBeLessThanOrEqual(80);
    });

    // Step 4: Calculate handicap index
    const result = calcHandicapIndex(differentials);
    expect(result).not.toBeNull();

    // 5 diffs → best 1, no adjustment
    expect(result!.differentialsUsed).toBe(1);
    expect(result!.adjustment).toBe(0);

    // The index should be a reasonable number
    expect(result!.index).toBeGreaterThanOrEqual(0);
    expect(result!.index).toBeLessThanOrEqual(54.0);
  });

  it("end-to-end: raw scores through to course handicap", () => {
    const courseHandicap = 18;

    // Calculate differentials for all rounds
    const differentials = rounds.map((rawScores) => {
      const { adjustedGross } = adjustScores(rawScores, holes, courseHandicap);
      return calcScoreDifferential(adjustedGross, courseRating, slopeRating, 0);
    });

    // Get handicap index
    const hiResult = calcHandicapIndex(differentials);
    expect(hiResult).not.toBeNull();
    const handicapIndex = hiResult!.index;

    // Step 5: Calculate course handicap for a different course
    const newCR = 72.5;
    const newSlope = 135;
    const newPar = 72;

    const ch = calcCourseHandicap(handicapIndex, newSlope, newCR, newPar);
    expect(typeof ch).toBe("number");

    // Step 6: Playing handicap at 95%
    const ph = calcPlayingHandicap(ch, 0.95);
    expect(ph).toBeLessThanOrEqual(ch);
    expect(ph).toBeGreaterThanOrEqual(0);
  });

  it("round 5 (par-like) produces the lowest differential", () => {
    const courseHandicap = 18;

    const differentials = rounds.map((rawScores) => {
      const { adjustedGross } = adjustScores(rawScores, holes, courseHandicap);
      return calcScoreDifferential(adjustedGross, courseRating, slopeRating, 0);
    });

    // Round 5 totals 72 (par), should have lowest diff
    const round5Diff = differentials[4];
    const minDiff = Math.min(...differentials);
    expect(round5Diff).toBe(minDiff);
  });
});
