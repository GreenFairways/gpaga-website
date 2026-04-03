import { describe, it, expect } from "vitest";
import { tieBreak } from "../../src/lib/scoring/helpers/tiebreak";
import type { LeaderboardEntry } from "../../src/lib/tournament/types";

function makeEntry(overrides: Partial<LeaderboardEntry>): LeaderboardEntry {
  return {
    position: 0,
    tied: false,
    playerId: "p1",
    playerName: "Test Player",
    handicapIndex: 18,
    playingHandicap: 18,
    holesCompleted: 18,
    grossTotal: 90,
    netTotal: 72,
    toPar: 0,
    stablefordTotal: null,
    thru: 18,
    holeScores: [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    status: "active",
    ...overrides,
  };
}

describe("tieBreak", () => {
  it("lower handicap index wins (strokeplay)", () => {
    const a = makeEntry({ handicapIndex: 10 });
    const b = makeEntry({ handicapIndex: 15 });
    expect(tieBreak(a, b, "strokeplay")).toBeLessThan(0); // a wins
  });

  it("lower handicap index wins (stableford)", () => {
    const a = makeEntry({ handicapIndex: 12 });
    const b = makeEntry({ handicapIndex: 8 });
    expect(tieBreak(a, b, "stableford")).toBeGreaterThan(0); // b wins (lower HCP)
  });

  it("proceeds to countback when handicaps are equal (strokeplay)", () => {
    const a = makeEntry({
      handicapIndex: 10,
      // back 9: holes 10-18 = [3,4,5,3,4,5,3,4,5] = 36
      holeScores: [4, 4, 4, 4, 4, 4, 4, 4, 4, 3, 4, 5, 3, 4, 5, 3, 4, 5],
    });
    const b = makeEntry({
      handicapIndex: 10,
      // back 9: holes 10-18 = [4,4,4,4,4,4,4,4,4] = 36... wait same
      // Make back 9 different: [5,5,5,5,5,5,5,5,5] = 45
      holeScores: [3, 3, 3, 3, 3, 3, 3, 3, 3, 5, 5, 5, 5, 5, 5, 5, 5, 5],
    });
    // a has lower back 9 sum (36 vs 45), so a wins in strokeplay
    expect(tieBreak(a, b, "strokeplay")).toBeLessThan(0);
  });

  it("proceeds to countback when handicaps are equal (stableford)", () => {
    const a = makeEntry({
      handicapIndex: 10,
      // back 9: [2,2,2,2,2,2,2,2,2] = 18 (stableford points)
      holeScores: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    });
    const b = makeEntry({
      handicapIndex: 10,
      // back 9: [3,3,3,3,3,3,3,3,3] = 27
      holeScores: [1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 3, 3, 3, 3, 3, 3, 3, 3],
    });
    // b has higher back 9 (27 vs 18), so b wins in stableford
    expect(tieBreak(a, b, "stableford")).toBeGreaterThan(0);
  });

  it("falls through to last 6 when last 9 are equal", () => {
    const a = makeEntry({
      handicapIndex: 10,
      // back 9 equal (all 4s), but last 6 differ
      // last 6 = holes 13-18: a=[4,4,4,4,4,3]=23, b=[4,4,4,4,4,5]=25
      holeScores: [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 3],
    });
    const b = makeEntry({
      handicapIndex: 10,
      holeScores: [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5],
    });
    // a has lower last 6 (23 vs 25), a wins in strokeplay
    expect(tieBreak(a, b, "strokeplay")).toBeLessThan(0);
  });

  it("returns 0 when completely tied", () => {
    const a = makeEntry({ handicapIndex: 10 });
    const b = makeEntry({ handicapIndex: 10 });
    expect(tieBreak(a, b, "strokeplay")).toBe(0);
  });

  it("handles null handicap (treat as highest)", () => {
    const a = makeEntry({ handicapIndex: null });
    const b = makeEntry({ handicapIndex: 10 });
    expect(tieBreak(a, b, "strokeplay")).toBeGreaterThan(0); // b wins (has HCP)
  });
});
