import { describe, it, expect } from "vitest";
import { calcScoreDifferential } from "@/lib/handicap/differential";
import { calcHandicapIndex } from "@/lib/handicap/index-calc";

/**
 * Nine-hole handling under WHS:
 * Two 9-hole differentials are combined into one 18-hole differential
 * by adding the two score differentials together.
 *
 * These tests simulate that workflow using the existing 18-hole functions.
 */
describe("nine-hole differential combination", () => {
  it("combines two 9-hole differentials into one 18-hole differential", () => {
    // 9-hole round 1: AGS=45, CR=36.0, Slope=125
    const diff9a = calcScoreDifferential(45, 36.0, 125, 0);
    // (113/125)*(45-36) = 0.904*9 = 8.136 → 8.1

    // 9-hole round 2: AGS=48, CR=36.5, Slope=128
    const diff9b = calcScoreDifferential(48, 36.5, 128, 0);
    // (113/128)*(48-36.5) = 0.8828125*11.5 = 10.152... → 10.1

    expect(diff9a).toBe(8.1);
    expect(diff9b).toBe(10.1);

    // Combined 18-hole differential = sum of two 9-hole diffs
    const combined = diff9a + diff9b;
    expect(combined).toBeCloseTo(18.2, 1);
  });
});

describe("building handicap from mixed 9-hole and 18-hole rounds", () => {
  it("uses combined 9-hole pairs alongside 18-hole differentials", () => {
    // Simulated 18-hole differentials
    const eighteenHoleDiff1 = 15.0;
    const eighteenHoleDiff2 = 17.0;

    // Two 9-hole rounds combined
    const combined9 = 8.1 + 10.1; // 18.2

    // We now have 3 effective 18-hole differentials
    const allDiffs = [eighteenHoleDiff1, eighteenHoleDiff2, combined9];

    const result = calcHandicapIndex(allDiffs);
    expect(result).not.toBeNull();
    // 3 diffs → best 1 (15.0), adjustment -2.0
    // index = 15.0 * 0.96 + (-2.0) = 12.399... → truncated 12.3
    expect(result!.index).toBe(12.3);
    expect(result!.differentialsUsed).toBe(1);
  });
});
