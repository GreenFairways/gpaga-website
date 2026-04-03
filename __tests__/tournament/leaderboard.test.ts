import { describe, it, expect } from "vitest";
import { computeLeaderboard } from "../../src/lib/tournament/leaderboard";

function makeScore(
  regId: string,
  playerId: string,
  name: string,
  playingHandicap: number,
  holeScores: number[],
) {
  return holeScores.map((score, i) => ({
    registrationId: regId,
    playerId,
    firstName: name.split(" ")[0],
    lastName: name.split(" ")[1] || "",
    handicapIndex: playingHandicap as number | null,
    playingHandicap,
    holeNumber: i + 1,
    rawScore: score,
    adjustedScore: score,
    stablefordPoints: null as number | null,
  }));
}

describe("computeLeaderboard — strokeplay", () => {
  it("sorts by net total ascending", () => {
    const scores = [
      ...makeScore("r1", "p1", "Alice Smith", 10, [4, 5, 3, 4, 5, 4, 3, 5, 4, 4, 5, 3, 4, 5, 4, 3, 5, 4]),
      ...makeScore("r2", "p2", "Bob Jones", 15, [5, 6, 4, 5, 6, 5, 4, 6, 5, 5, 6, 4, 5, 6, 5, 4, 6, 5]),
    ];

    const lb = computeLeaderboard(scores, "strokeplay", 72);

    expect(lb).toHaveLength(2);

    // Alice: gross = 75, net = 75-10 = 65
    // Bob: gross = 91, net = 91-15 = 76
    expect(lb[0].playerName).toBe("Alice Smith");
    expect(lb[0].position).toBe(1);
    expect(lb[0].grossTotal).toBe(74);
    expect(lb[0].netTotal).toBe(64); // 74 - 10

    expect(lb[1].playerName).toBe("Bob Jones");
    expect(lb[1].position).toBe(2);
    expect(lb[1].netTotal).toBe(77); // 92 - 15
  });

  it("handles ties correctly", () => {
    const scores = [
      ...makeScore("r1", "p1", "Alice A", 10, [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]), // gross 72, net 62
      ...makeScore("r2", "p2", "Bob B", 10, [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]),   // same
    ];

    const lb = computeLeaderboard(scores, "strokeplay", 72);

    expect(lb[0].position).toBe(1);
    expect(lb[0].tied).toBe(true);
    expect(lb[1].position).toBe(1);
    expect(lb[1].tied).toBe(true);
  });

  it("computes toPar correctly", () => {
    const scores = makeScore("r1", "p1", "Alice A", 0, [
      4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
    ]); // gross 72, net 72 (HCP 0)

    const lb = computeLeaderboard(scores, "strokeplay", 72);
    expect(lb[0].toPar).toBe(0);
    expect(lb[0].grossTotal).toBe(72);
  });

  it("tracks holes completed and thru", () => {
    // Only 9 holes entered
    const scores = makeScore("r1", "p1", "Alice A", 10, [
      4, 5, 3, 4, 5, 4, 3, 5, 4,
    ]);

    const lb = computeLeaderboard(scores, "strokeplay", 72);
    expect(lb[0].holesCompleted).toBe(9);
    expect(lb[0].thru).toBe(9);
  });
});

describe("computeLeaderboard — stableford", () => {
  it("sorts by stableford points descending", () => {
    const scores1 = makeScore("r1", "p1", "Alice A", 10, [4, 4, 4]).map(
      (s) => ({ ...s, stablefordPoints: 2 }),
    );
    const scores2 = makeScore("r2", "p2", "Bob B", 15, [4, 4, 4]).map(
      (s) => ({ ...s, stablefordPoints: 3 }),
    );

    const lb = computeLeaderboard([...scores1, ...scores2], "stableford", 72);

    // Bob has 9 points (3*3), Alice has 6 (2*3)
    expect(lb[0].playerName).toBe("Bob B");
    expect(lb[0].stablefordTotal).toBe(9);
    expect(lb[1].playerName).toBe("Alice A");
    expect(lb[1].stablefordTotal).toBe(6);
  });
});
