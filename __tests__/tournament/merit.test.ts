import { describe, it, expect } from "vitest";
import {
  computeOrderOfMerit,
  DEFAULT_MERIT_POINTS,
} from "../../src/lib/tournament/merit";

describe("computeOrderOfMerit", () => {
  it("awards points based on position", () => {
    const results = [
      {
        tournamentId: "t1",
        tournamentName: "Season Opener",
        tournamentDate: "2026-05-15",
        playerId: "p1",
        playerName: "Alice",
        position: 1,
      },
      {
        tournamentId: "t1",
        tournamentName: "Season Opener",
        tournamentDate: "2026-05-15",
        playerId: "p2",
        playerName: "Bob",
        position: 2,
      },
    ];

    const merit = computeOrderOfMerit(results);

    expect(merit).toHaveLength(2);
    expect(merit[0].playerName).toBe("Alice");
    expect(merit[0].totalPoints).toBe(100); // 1st place
    expect(merit[1].playerName).toBe("Bob");
    expect(merit[1].totalPoints).toBe(80); // 2nd place
  });

  it("accumulates points across tournaments", () => {
    const results = [
      {
        tournamentId: "t1",
        tournamentName: "Event 1",
        tournamentDate: "2026-05-01",
        playerId: "p1",
        playerName: "Alice",
        position: 1,
      },
      {
        tournamentId: "t2",
        tournamentName: "Event 2",
        tournamentDate: "2026-06-01",
        playerId: "p1",
        playerName: "Alice",
        position: 3,
      },
    ];

    const merit = computeOrderOfMerit(results);
    expect(merit[0].totalPoints).toBe(100 + 65); // 1st + 3rd
    expect(merit[0].tournamentsPlayed).toBe(2);
    expect(merit[0].bestFinish).toBe(1);
  });

  it("awards participation points for positions beyond schedule", () => {
    const results = [
      {
        tournamentId: "t1",
        tournamentName: "Event",
        tournamentDate: "2026-05-01",
        playerId: "p1",
        playerName: "Last Place",
        position: 50, // Beyond the 29-position schedule
      },
    ];

    const merit = computeOrderOfMerit(results);
    expect(merit[0].totalPoints).toBe(DEFAULT_MERIT_POINTS.participationPoints);
  });

  it("sorts by total points, then best finish", () => {
    const results = [
      {
        tournamentId: "t1",
        tournamentName: "Event",
        tournamentDate: "2026-05-01",
        playerId: "p1",
        playerName: "Alice",
        position: 5,
      },
      {
        tournamentId: "t1",
        tournamentName: "Event",
        tournamentDate: "2026-05-01",
        playerId: "p2",
        playerName: "Bob",
        position: 5,
      },
      {
        tournamentId: "t2",
        tournamentName: "Event 2",
        tournamentDate: "2026-06-01",
        playerId: "p1",
        playerName: "Alice",
        position: 1,
      },
      {
        tournamentId: "t2",
        tournamentName: "Event 2",
        tournamentDate: "2026-06-01",
        playerId: "p2",
        playerName: "Bob",
        position: 2,
      },
    ];

    const merit = computeOrderOfMerit(results);
    // Alice: 50 + 100 = 150, bestFinish=1
    // Bob: 50 + 80 = 130, bestFinish=2
    expect(merit[0].playerName).toBe("Alice");
    expect(merit[1].playerName).toBe("Bob");
  });

  it("handles empty results", () => {
    const merit = computeOrderOfMerit([]);
    expect(merit).toEqual([]);
  });
});
