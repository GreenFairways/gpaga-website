import { describe, it, expect } from "vitest";
import {
  calcNetDoubleBogey,
  calcStrokesPerHole,
  adjustScores,
} from "@/lib/handicap/adjustment";

describe("calcNetDoubleBogey", () => {
  it("par 4, 0 handicap strokes → NDB = 6", () => {
    expect(calcNetDoubleBogey(4, 0)).toBe(6);
  });

  it("par 4, 1 handicap stroke → NDB = 7", () => {
    expect(calcNetDoubleBogey(4, 1)).toBe(7);
  });

  it("par 5, 2 handicap strokes → NDB = 9", () => {
    expect(calcNetDoubleBogey(5, 2)).toBe(9);
  });
});

describe("calcStrokesPerHole", () => {
  // Helper: 18 holes with SI 1..18
  const holes = Array.from({ length: 18 }, (_, i) => ({ strokeIndex: i + 1 }));

  it("CH=18 → every hole gets exactly 1 stroke", () => {
    const result = calcStrokesPerHole(18, holes);
    expect(result).toEqual(Array(18).fill(1));
  });

  it("CH=20 → SI 1-2 get 2 strokes, SI 3-18 get 1", () => {
    const result = calcStrokesPerHole(20, holes);
    // base = floor(20/18) = 1, extra = 20 % 18 = 2
    // SI <= 2 → 2 strokes, rest → 1
    expect(result[0]).toBe(2); // SI 1
    expect(result[1]).toBe(2); // SI 2
    for (let i = 2; i < 18; i++) {
      expect(result[i]).toBe(1); // SI 3..18
    }
  });
});

describe("adjustScores", () => {
  // 18 holes, all par 4, SI 1..18
  const holes = Array.from({ length: 18 }, (_, i) => ({
    par: 4,
    strokeIndex: i + 1,
  }));

  it("caps scores at Net Double Bogey", () => {
    // CH=18 → each hole gets 1 stroke → NDB = 4+2+1 = 7
    const raw = [
      10, 5, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
    ];
    const { adjustedScores, adjustedGross } = adjustScores(raw, holes, 18);

    // Hole 1 raw=10, NDB=7 → capped at 7
    expect(adjustedScores[0]).toBe(7);
    // Hole 2 raw=5, NDB=7 → stays 5
    expect(adjustedScores[1]).toBe(5);
    // Hole 3 raw=3, NDB=7 → stays 3
    expect(adjustedScores[2]).toBe(3);

    // AGS = 7 + 5 + 3 + 15*4 = 75
    expect(adjustedGross).toBe(75);
  });

  it("scores within NDB remain unchanged", () => {
    const raw = Array(18).fill(5); // all 5 on par 4
    const { adjustedScores } = adjustScores(raw, holes, 18);
    // NDB = 7 for each hole, all raws are 5 → no change
    expect(adjustedScores).toEqual(Array(18).fill(5));
  });
});
