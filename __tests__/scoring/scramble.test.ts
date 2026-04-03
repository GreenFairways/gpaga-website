import { describe, it, expect } from "vitest";
import { computeLeaderboard } from "../../src/lib/scoring/engine";
import { calcScrambleTeamHandicap } from "../../src/lib/scoring/strategies/scramble";
import type { ScoreRow } from "../../src/lib/scoring/types";
import type { Team, TeamMember } from "../../src/lib/tournament/types";

function makeTeamScores(
  teamId: string,
  teamName: string,
  holeScores: number[],
): ScoreRow[] {
  return holeScores.map((score, i) => ({
    registrationId: `reg-${teamId}`,
    playerId: teamId,
    firstName: teamName,
    lastName: "",
    handicapIndex: null,
    playingHandicap: 0,
    holeNumber: i + 1,
    rawScore: score,
    adjustedScore: score,
    stablefordPoints: null,
    teamId,
    teamName,
  }));
}

function makeTeam(
  id: string,
  name: string,
  members: { firstName: string; lastName: string; playingHandicap: number }[],
): Team & { members: TeamMember[] } {
  return {
    id,
    tournamentId: "t1",
    name,
    teamHandicap: null,
    seed: null,
    createdAt: "2026-01-01",
    members: members.map((m, i) => ({
      registrationId: `reg-${id}-${i}`,
      playerId: `p-${id}-${i}`,
      firstName: m.firstName,
      lastName: m.lastName,
      handicapIndex: m.playingHandicap,
      playingHandicap: m.playingHandicap,
    })),
  };
}

describe("calcScrambleTeamHandicap", () => {
  it("2-ball: 35% lower + 15% higher", () => {
    // Player A: CH 10, Player B: CH 20
    const result = calcScrambleTeamHandicap([10, 20]);
    // 10 * 0.35 + 20 * 0.15 = 3.5 + 3 = 6.5 → round = 7
    expect(result).toBe(7);
  });

  it("2-ball: handles same handicaps", () => {
    const result = calcScrambleTeamHandicap([15, 15]);
    // 15 * 0.35 + 15 * 0.15 = 5.25 + 2.25 = 7.5 → round = 8
    expect(result).toBe(8);
  });

  it("2-ball: sorts by CH ascending regardless of input order", () => {
    const a = calcScrambleTeamHandicap([20, 10]);
    const b = calcScrambleTeamHandicap([10, 20]);
    expect(a).toBe(b);
  });

  it("3-ball: 20% lowest + 15% middle + 10% highest", () => {
    const result = calcScrambleTeamHandicap([5, 15, 25]);
    // 5 * 0.20 + 15 * 0.15 + 25 * 0.10 = 1 + 2.25 + 2.5 = 5.75 → 6
    expect(result).toBe(6);
  });

  it("4-ball: 10/20/30/40% (Ambrose)", () => {
    const result = calcScrambleTeamHandicap([5, 10, 15, 20]);
    // 5*0.10 + 10*0.20 + 15*0.30 + 20*0.40 = 0.5 + 2 + 4.5 + 8 = 15
    expect(result).toBe(15);
  });

  it("custom percentages override defaults", () => {
    const result = calcScrambleTeamHandicap([10, 20], [0.50, 0.25]);
    // 10 * 0.50 + 20 * 0.25 = 5 + 5 = 10
    expect(result).toBe(10);
  });

  it("handles zero handicaps", () => {
    const result = calcScrambleTeamHandicap([0, 0]);
    expect(result).toBe(0);
  });
});

describe("computeLeaderboard — scramble", () => {
  const teams = [
    makeTeam("t1", "Team Alpha", [
      { firstName: "Stas", lastName: "V", playingHandicap: 10 },
      { firstName: "Zaur", lastName: "G", playingHandicap: 20 },
    ]),
    makeTeam("t2", "Team Beta", [
      { firstName: "Maka", lastName: "P", playingHandicap: 8 },
      { firstName: "Sophie", lastName: "G", playingHandicap: 16 },
    ]),
  ];

  it("ranks teams by net total ascending", () => {
    const scores = [
      // Team Alpha: gross 65 (all par 4, some birdies)
      ...makeTeamScores("t1", "Team Alpha", [4, 3, 4, 3, 4, 4, 3, 4, 4, 3, 4, 4, 3, 4, 4, 3, 4, 3]),
      // Team Beta: gross 68
      ...makeTeamScores("t2", "Team Beta", [4, 4, 4, 4, 4, 4, 3, 4, 4, 4, 4, 3, 4, 4, 3, 4, 4, 4]),
    ];

    const lb = computeLeaderboard(scores, "scramble", 72, undefined, teams);

    expect(lb).toHaveLength(2);
    // Team Alpha: gross=65, HCP = 10*0.35+20*0.15 = 7, net = 65-7 = 58
    // Team Beta: gross=69, HCP = 8*0.35+16*0.15 = 5, net = 69-5 = 64
    expect(lb[0].teamName).toBe("Team Alpha");
    expect(lb[0].grossTotal).toBe(65);
    expect(lb[0].netTotal).toBe(58);
    expect(lb[0].position).toBe(1);

    expect(lb[1].teamName).toBe("Team Beta");
    expect(lb[1].grossTotal).toBe(69);
    expect(lb[1].netTotal).toBe(64);
    expect(lb[1].position).toBe(2);
  });

  it("includes team members in entry", () => {
    const scores = makeTeamScores("t1", "Team Alpha", [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]);
    const lb = computeLeaderboard(scores, "scramble", 72, undefined, teams);
    expect(lb[0].teamMembers).toEqual(["Stas V", "Zaur G"]);
  });

  it("handles partial rounds", () => {
    const scores = makeTeamScores("t1", "Team Alpha", [4, 3, 4, 3, 4]);
    const lb = computeLeaderboard(scores, "scramble", 72, undefined, teams);
    expect(lb[0].holesCompleted).toBe(5);
    expect(lb[0].thru).toBe(5);
  });

  it("handles ties with tiebreak", () => {
    // Both teams gross 72, but different handicaps → different net
    const scores = [
      ...makeTeamScores("t1", "Team Alpha", [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]),
      ...makeTeamScores("t2", "Team Beta", [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]),
    ];
    const lb = computeLeaderboard(scores, "scramble", 72, undefined, teams);
    // Alpha: net 72-7=65, Beta: net 72-5=67 → Alpha wins
    expect(lb[0].teamName).toBe("Team Alpha");
  });
});
