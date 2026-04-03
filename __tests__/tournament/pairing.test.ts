import { describe, it, expect } from "vitest";
import {
  generatePairings,
  buildGroups,
  buildFlights,
  sortByHandicap,
  autoFlightCount,
} from "../../src/lib/tournament/pairing";
import type { RegistrationWithPlayer } from "../../src/lib/tournament/types";

function makeReg(
  id: string,
  playingHandicap: number | null,
): RegistrationWithPlayer {
  return {
    id,
    tournamentId: "t1",
    playerId: `p-${id}`,
    status: "registered",
    handicapIndexAtReg: playingHandicap,
    courseHandicap: playingHandicap,
    playingHandicap,
    divisionLabel: null,
    teamId: null,
    flightNumber: null,
    groupNumber: null,
    teeTime: null,
    registeredAt: "2026-01-01",
    accessCode: "ABC123",
    firstName: `Player`,
    lastName: id,
    email: `${id}@test.com`,
    gender: "M",
  };
}

describe("autoFlightCount", () => {
  it("returns 1 for under 20 players", () => {
    expect(autoFlightCount(15)).toBe(1);
    expect(autoFlightCount(5)).toBe(1);
  });

  it("returns 2 for 20-40 players", () => {
    expect(autoFlightCount(20)).toBe(2);
    expect(autoFlightCount(40)).toBe(2);
  });

  it("returns 3 for 41-60 players", () => {
    expect(autoFlightCount(50)).toBe(3);
  });

  it("returns 4 for 61+ players", () => {
    expect(autoFlightCount(80)).toBe(4);
  });
});

describe("sortByHandicap", () => {
  it("sorts ascending, nulls last", () => {
    const regs = [makeReg("a", 15), makeReg("b", null), makeReg("c", 5)];
    const sorted = sortByHandicap(regs);
    expect(sorted.map((r) => r.id)).toEqual(["c", "a", "b"]);
  });
});

describe("buildFlights", () => {
  it("builds auto flights correctly", () => {
    const regs = Array.from({ length: 8 }, (_, i) =>
      makeReg(`r${i}`, i * 3),
    );
    const sorted = sortByHandicap(regs);
    const flights = buildFlights(sorted, { mode: "auto", count: 2 });

    expect(flights).toHaveLength(2);
    expect(flights[0].label).toBe("A");
    expect(flights[1].label).toBe("B");
    expect(flights[0].registrationIds).toHaveLength(4);
    expect(flights[1].registrationIds).toHaveLength(4);
    // Flight A should have lower handicaps
    expect(flights[0].handicapMax).toBeLessThan(flights[1].handicapMin);
  });

  it("handles manual boundaries", () => {
    const regs = [
      makeReg("low1", 5),
      makeReg("low2", 8),
      makeReg("mid1", 15),
      makeReg("high1", 25),
    ];
    const sorted = sortByHandicap(regs);
    const flights = buildFlights(sorted, {
      mode: "manual",
      count: 2,
      boundaries: [
        [0, 12],
        [13, 54],
      ],
    });

    expect(flights).toHaveLength(2);
    expect(flights[0].registrationIds).toHaveLength(2); // low1, low2
    expect(flights[1].registrationIds).toHaveLength(2); // mid1, high1
  });
});

describe("buildGroups", () => {
  it("puts 4 or fewer in one group", () => {
    const ids = ["a", "b", "c"];
    const groups = buildGroups(ids, 1, 1);
    expect(groups).toHaveLength(1);
    expect(groups[0].registrationIds).toEqual(["a", "b", "c"]);
  });

  it("creates correct number of groups for 8 players", () => {
    const ids = Array.from({ length: 8 }, (_, i) => `r${i}`);
    const groups = buildGroups(ids, 1, 1);
    expect(groups).toHaveLength(2);
    // Each group should have 4 players
    expect(groups[0].registrationIds).toHaveLength(4);
    expect(groups[1].registrationIds).toHaveLength(4);
  });

  it("handles 7 players (groups of 4 and 3)", () => {
    const ids = Array.from({ length: 7 }, (_, i) => `r${i}`);
    const groups = buildGroups(ids, 1, 1);
    expect(groups).toHaveLength(2);
    const total = groups.reduce((s, g) => s + g.registrationIds.length, 0);
    expect(total).toBe(7);
  });

  it("snake-drafts for mixed handicaps", () => {
    // 8 players sorted by HCP: r0(best)..r7(worst)
    const ids = ["r0", "r1", "r2", "r3", "r4", "r5", "r6", "r7"];
    const groups = buildGroups(ids, 1, 1);

    // Snake: group1 gets r0, r3, r4, r7; group2 gets r1, r2, r5, r6
    // This means each group has a mix
    const g1 = groups[0].registrationIds;
    const g2 = groups[1].registrationIds;
    expect(g1).toContain("r0"); // best player
    expect(g1).toContain("r7"); // worst player
    expect(g2).toContain("r1");
    expect(g2).toContain("r6");
  });
});

describe("generatePairings", () => {
  it("generates complete pairings with tee times", () => {
    const regs = Array.from({ length: 12 }, (_, i) =>
      makeReg(`r${i}`, i * 4),
    );
    const result = generatePairings({
      registrations: regs,
      flightConfig: null,
      startTime: "08:00",
      intervalMinutes: 10,
    });

    // 12 players = 1 flight (< 20)
    expect(result.flights).toHaveLength(1);

    // 12 / 4 = 3 groups
    expect(result.groups).toHaveLength(3);

    // Tee times should be 08:00, 08:10, 08:20
    expect(result.groups[0].teeTime).toBe("08:00");
    expect(result.groups[1].teeTime).toBe("08:10");
    expect(result.groups[2].teeTime).toBe("08:20");

    // All players should be assigned
    const totalPlayers = result.groups.reduce(
      (s, g) => s + g.registrationIds.length,
      0,
    );
    expect(totalPlayers).toBe(12);
  });

  it("excludes withdrawn players", () => {
    const regs = [
      makeReg("r1", 10),
      { ...makeReg("r2", 15), status: "withdrawn" as const },
      makeReg("r3", 20),
    ];
    const result = generatePairings({
      registrations: regs,
      flightConfig: null,
      startTime: "09:00",
      intervalMinutes: 8,
    });

    const totalPlayers = result.groups.reduce(
      (s, g) => s + g.registrationIds.length,
      0,
    );
    expect(totalPlayers).toBe(2); // r2 excluded
  });

  it("handles multi-flight with 30 players", () => {
    const regs = Array.from({ length: 30 }, (_, i) =>
      makeReg(`r${i}`, i + 1),
    );
    const result = generatePairings({
      registrations: regs,
      flightConfig: { mode: "auto", count: 2 },
      startTime: "07:30",
      intervalMinutes: 10,
    });

    expect(result.flights).toHaveLength(2);
    expect(result.flights[0].label).toBe("A");
    expect(result.flights[1].label).toBe("B");

    // All 30 players assigned
    const totalPlayers = result.groups.reduce(
      (s, g) => s + g.registrationIds.length,
      0,
    );
    expect(totalPlayers).toBe(30);
  });
});
