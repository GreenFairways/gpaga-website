import { describe, it, expect } from "vitest";
import { calcHandicapIndex } from "@/lib/handicap/index-calc";

describe("calcHandicapIndex", () => {
  it("3 differentials → best 1, adjustment -2.0", () => {
    const result = calcHandicapIndex([15.0, 20.0, 25.0]);
    expect(result).not.toBeNull();
    // best 1 = 15.0, raw = 15.0 * 0.96 + (-2.0) = 12.399... → truncated 12.3
    expect(result!.index).toBe(12.3);
    expect(result!.differentialsUsed).toBe(1);
    expect(result!.adjustment).toBe(-2.0);
  });

  it("5 differentials → best 1, no adjustment", () => {
    const diffs = [10.0, 12.0, 14.0, 16.0, 18.0];
    const result = calcHandicapIndex(diffs);
    expect(result).not.toBeNull();
    // best 1 = 10.0, raw = 10.0 * 0.96 + 0 = 9.6
    expect(result!.index).toBe(9.6);
    expect(result!.differentialsUsed).toBe(1);
    expect(result!.adjustment).toBe(0);
  });

  it("20 differentials → best 8, no adjustment", () => {
    // 20 differentials: 5.0, 6.0, 7.0, ..., 24.0
    const diffs = Array.from({ length: 20 }, (_, i) => 5.0 + i);
    const result = calcHandicapIndex(diffs);
    expect(result).not.toBeNull();
    // best 8 = 5,6,7,8,9,10,11,12 → avg = 8.5
    // index = 8.5 * 0.96 + 0 = 8.16 → truncated = 8.1
    expect(result!.index).toBe(8.1);
    expect(result!.differentialsUsed).toBe(8);
    expect(result!.adjustment).toBe(0);
  });

  it("fewer than 3 differentials → returns null", () => {
    expect(calcHandicapIndex([10.0])).toBeNull();
    expect(calcHandicapIndex([10.0, 12.0])).toBeNull();
    expect(calcHandicapIndex([])).toBeNull();
  });

  it("caps at 54.0", () => {
    // 3 very high differentials
    const diffs = [60.0, 65.0, 70.0];
    const result = calcHandicapIndex(diffs);
    expect(result).not.toBeNull();
    // best 1 = 60.0, raw = 60.0 * 0.96 + (-2.0) = 55.6
    // capped at 54.0
    expect(result!.index).toBe(54.0);
  });
});
