import { describe, it, expect } from "vitest";
import { computeLeaderboard } from "../../src/lib/scoring/engine";
import type { ScoreRow } from "../../src/lib/scoring/types";

function makeScores(
  regId: string,
  playerId: string,
  name: string,
  playingHandicap: number,
  holeScores: number[],
  stablefordPoints?: number,
): ScoreRow[] {
  return holeScores.map((score, i) => ({
    registrationId: regId,
    playerId,
    firstName: name.split(" ")[0],
    lastName: name.split(" ")[1] || "",
    handicapIndex: playingHandicap,
    playingHandicap,
    holeNumber: i + 1,
    rawScore: score,
    adjustedScore: score,
    stablefordPoints: stablefordPoints ?? null,
  }));
}

const PAR = 72;

describe("computeLeaderboard — engine dispatch", () => {
  it("dispatches strokeplay correctly", () => {
    const scores = [
      ...makeScores("r1", "p1", "Alice Smith", 10, [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]),
      ...makeScores("r2", "p2", "Bob Jones", 15, [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5]),
    ];

    const lb = computeLeaderboard(scores, "strokeplay", PAR);
    expect(lb).toHaveLength(2);
    expect(lb[0].playerName).toBe("Alice Smith");
    expect(lb[0].netTotal).toBe(62); // 72 - 10
    expect(lb[1].netTotal).toBe(75); // 90 - 15
  });

  it("dispatches stableford correctly", () => {
    const scores = [
      ...makeScores("r1", "p1", "Alice A", 10, [4, 4, 4], 2),
      ...makeScores("r2", "p2", "Bob B", 15, [4, 4, 4], 3),
    ];

    const lb = computeLeaderboard(scores, "stableford", PAR);
    expect(lb[0].playerName).toBe("Bob B");
    expect(lb[0].stablefordTotal).toBe(9);
  });

  it("falls back to strokeplay for unknown format", () => {
    const scores = makeScores("r1", "p1", "Alice A", 10, [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]);
    // "skins" has no strategy yet, should fallback to strokeplay
    const lb = computeLeaderboard(scores, "skins", PAR);
    expect(lb).toHaveLength(1);
    expect(lb[0].netTotal).toBe(62);
  });

  it("applies tiebreak: lower handicap wins", () => {
    const scores = [
      ...makeScores("r1", "p1", "Alice A", 10,
        [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]), // net 62
      ...makeScores("r2", "p2", "Bob B", 10,
        [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]), // net 62
    ];
    // Same handicap, same scores => tied (position 1 for both)
    const lb = computeLeaderboard(scores, "strokeplay", PAR);
    expect(lb[0].position).toBe(1);
    expect(lb[1].position).toBe(1);
    expect(lb[0].tied).toBe(true);
  });

  it("applies tiebreak: different handicap breaks tie", () => {
    // Both net 62, but different handicaps
    const scores = [
      ...makeScores("r1", "p1", "Alice A", 10,
        [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]),
      ...makeScores("r2", "p2", "Bob B", 8,
        [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 2]),
    ];
    // Alice: gross 72, net 62. Bob: gross 70, net 62. Same net.
    // Bob has lower HCP (8 vs 10), Bob wins tiebreak
    const lb = computeLeaderboard(scores, "strokeplay", PAR);
    expect(lb[0].playerName).toBe("Bob B");
    expect(lb[0].position).toBe(1);
    expect(lb[1].position).toBe(2);
    expect(lb[0].tied).toBe(false);
  });

  it("includes status field", () => {
    const scores = makeScores("r1", "p1", "Alice A", 10, [4, 4, 4]);
    const lb = computeLeaderboard(scores, "strokeplay", PAR);
    expect(lb[0].status).toBe("active");
  });
});
