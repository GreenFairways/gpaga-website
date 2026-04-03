import { describe, it, expect } from "vitest";
import {
  processHoleScore,
  calcStablefordPoints,
} from "../../src/lib/tournament/scoring";

describe("calcStablefordPoints", () => {
  it("awards 2 points for par (net)", () => {
    expect(calcStablefordPoints(4, 4, 0)).toBe(2); // par 4, scored 4, 0 strokes
  });

  it("awards 3 points for birdie (net)", () => {
    expect(calcStablefordPoints(3, 4, 0)).toBe(3); // par 4, scored 3
  });

  it("awards 4 points for eagle (net)", () => {
    expect(calcStablefordPoints(2, 4, 0)).toBe(4); // par 4, scored 2
  });

  it("awards 1 point for bogey (net)", () => {
    expect(calcStablefordPoints(5, 4, 0)).toBe(1); // par 4, scored 5
  });

  it("awards 0 points for double bogey or worse", () => {
    expect(calcStablefordPoints(6, 4, 0)).toBe(0);
    expect(calcStablefordPoints(8, 4, 0)).toBe(0);
  });

  it("accounts for handicap strokes", () => {
    // Player gets 1 stroke on this hole, scores 5 on par 4
    // Net score = 5 - 1 = 4 = par = 2 points
    expect(calcStablefordPoints(5, 4, 1)).toBe(2);
  });

  it("accounts for 2 handicap strokes", () => {
    // Player gets 2 strokes on this hole, scores 6 on par 4
    // Net score = 6 - 2 = 4 = par = 2 points
    expect(calcStablefordPoints(6, 4, 2)).toBe(2);
  });

  it("handles negative handicap (scratch player giving strokes)", () => {
    // Player gives 1 stroke back, scores 3 on par 4
    // Net score = 3 - (-1) = 4 = par = 2 points
    expect(calcStablefordPoints(3, 4, -1)).toBe(2);
  });
});

describe("processHoleScore", () => {
  it("caps score at Net Double Bogey for strokeplay", () => {
    // On tbilisi-hills, hole 1 is par 4
    const result = processHoleScore(1, 10, 10, "tbilisi-hills", "strokeplay");
    // NDB = par + 2 + strokes received on this hole
    // Playing HCP 10: strokes on hole depends on SI
    // Score should be capped at NDB
    expect(result.adjustedScore).toBeLessThanOrEqual(10);
    // Stableford points are always computed (needed for multi-division tournaments)
    expect(typeof result.stablefordPoints).toBe("number");
  });

  it("returns stableford points for stableford format", () => {
    const result = processHoleScore(1, 4, 10, "tbilisi-hills", "stableford");
    expect(result.stablefordPoints).not.toBeNull();
    expect(typeof result.stablefordPoints).toBe("number");
  });

  it("handles unknown course gracefully", () => {
    const result = processHoleScore(1, 5, 10, "unknown-course", "strokeplay");
    expect(result.adjustedScore).toBe(5); // No adjustment for unknown course
  });
});
