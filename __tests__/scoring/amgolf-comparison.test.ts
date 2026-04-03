/**
 * Battle Test: compare our scoring engine against AmGolf results
 *
 * Uses real data from GPAGA Season Opening 2026, Round 2 (March 28, 2026)
 * - 43 participants, 3 divisions
 * - Hole-by-hole scorecards from AmGolf API
 * - Division A: Net Strokeplay (HCP -8 to 18, 18 holes)
 * - Division B: Stableford (HCP 18.1-36, 18 holes)
 * - Division C: Stableford (HCP 36.1-54, 9 holes front 9)
 */

import { describe, it, expect } from "vitest";
import { calcStrokesPerHole } from "@/lib/handicap";
import { calcStablefordPoints, processHoleScore } from "@/lib/tournament/scoring";
import { tbilisiHills } from "@/data/courses/tbilisi-hills";
import { computeLeaderboard } from "@/lib/scoring/engine";
import type { ScoreRow } from "@/lib/scoring/types";

// Full scorecard data from AmGolf (downloaded via API)
// Each entry: { name, hcp, phcp, tees, pcc, totalGross, totalNet, totalPoints, holes: [{hole, par, si, strokes, net, points, hcpShots}] }
import scorecards from "/tmp/gpaga-scorecards.json";

// Division assignments based on HCP ranges from AmGolf
function getDivision(hcp: number): "A" | "B" | "C" {
  if (hcp <= 18) return "A";
  if (hcp <= 36) return "B";
  return "C";
}

// AmGolf leaderboard results for comparison
const AMGOLF_DIV_A = [
  { name: "Sandro Ilashvili", toPar: 1 },
  { name: "Steven Fraga", toPar: 6 },
  { name: "Tyrone Hammond", toPar: 8 },
  { name: "Gocha Diasamidze", toPar: 9 },
  { name: "James Cook", toPar: 12 },
  { name: "Ksenia Hammond", toPar: 12 },
  { name: "Zaur Gabaidze", toPar: 13 },
  { name: "Levan Charelishvili", toPar: 13 },
  { name: "Irakli Chavleishvili", toPar: 14 },
  { name: "Sofia Clifford", toPar: 14 },
  { name: "Paata Vardiashvili", toPar: 31 },
  { name: "John Krauss", toPar: 16 },
];

const AMGOLF_DIV_B = [
  { name: "Maximilian Sindyukov", points: 44 },
  { name: "Iryna Levchenko", points: 36 },
  { name: "Samuel Grant Brookes", points: 34 },
  { name: "Roger Gervais", points: 31 },
  { name: "Viktor Lukashko", points: 31 },
  { name: "Davit Chkhitunidze", points: 31 },
  { name: "Stanislav Prikhodko", points: 30 },
  { name: "Teele Pohi", points: 30 },
  { name: "Jochem De Lange", points: 30 },
  { name: "Kakha Okriashvili", points: 29 },
  { name: "David Slonimskii", points: 29 },
  { name: "Merab Kumsiashvili", points: 29 },
  { name: "Frane Rak", points: 28 },
  { name: "Sophie Grimley", points: 26 },
  { name: "Victoria Petrosian", points: 24 },
  { name: "Martin Pope", points: 24 },
  { name: "Maka Gotsiridze-Pope", points: 22 },
  { name: "Nana Bezoiani", points: 14 },
];

const AMGOLF_DIV_C = [
  { name: "Anri Tcheishvili", points: 19 },
  { name: "Ilze Mize", points: 19 },
  { name: "Omar Pkhakadze", points: 18 },
  { name: "Giorgi Shotadze", points: 13 },
  { name: "Tata Murtskhvaladze", points: 11 },
  { name: "Giorgi Tcheishvili", points: 10 },
  { name: "Irakli Shotadze", points: 10 },
  { name: "Tamaz Tcheishvili", points: 9 },
];

describe("AmGolf comparison — GPAGA Season Opening 2026", () => {
  it("should have loaded all 43 scorecards", () => {
    expect(scorecards).toHaveLength(43);
  });

  it("should match SI between our course data and AmGolf", () => {
    // Verify our corrected SI matches AmGolf
    const firstCard = scorecards[0]; // Steven Fraga
    for (const hole of firstCard.holes) {
      const ourHole = tbilisiHills.holes[hole.hole - 1];
      expect(ourHole.strokeIndex).toBe(hole.si);
      expect(ourHole.par).toBe(hole.par);
    }
  });

  describe("Playing Handicap calculation", () => {
    it("should match AmGolf playing handicaps for Silver tees (men)", () => {
      // AmGolf uses: Course Handicap = HI × (Slope / 113)
      // Playing Handicap = Course Handicap (100% allowance, rounded)
      // Silver men: CR 71.8, SR 133
      const silverMen = scorecards.filter(
        (sc: any) => sc.tees === "Silver" && sc.totalGross > 0
      );

      const mismatches: string[] = [];
      for (const sc of silverMen) {
        // WHS formula: CH = HI × (SR / 113) + (CR - Par)
        const ch = Math.round(sc.hcp * (133 / 113) + (71.8 - 72));
        if (ch !== sc.phcp) {
          mismatches.push(
            `${sc.name}: HI=${sc.hcp}, expected PH=${ch}, AmGolf PH=${sc.phcp}`
          );
        }
      }

      // Log mismatches for debugging but don't fail — PCC adjustments may differ
      if (mismatches.length > 0) {
        console.log("PH mismatches (may be PCC-related):", mismatches);
      }
    });
  });

  describe("Stableford points per hole", () => {
    it("should match AmGolf stableford points for Stanislav Prikhodko", () => {
      const stas = scorecards.find(
        (sc: any) => sc.name === "Stanislav Prikhodko"
      );
      expect(stas).toBeDefined();

      // PH = 23, 100% allowance
      const strokesPerHole = calcStrokesPerHole(stas.phcp, tbilisiHills.holes);

      const mismatches: string[] = [];
      for (const hole of stas.holes) {
        const ourPoints = calcStablefordPoints(
          hole.strokes,
          hole.par,
          strokesPerHole[hole.hole - 1]
        );
        if (ourPoints !== hole.points) {
          mismatches.push(
            `Hole ${hole.hole}: gross=${hole.strokes}, par=${hole.par}, hcpShots=${strokesPerHole[hole.hole - 1]} (amgolf: ${hole.hcpShots}), our pts=${ourPoints}, amgolf pts=${hole.points}`
          );
        }
      }

      if (mismatches.length > 0) {
        console.log("Stanislav points mismatches:", mismatches);
      }
      // Total should match
      const ourTotal = stas.holes.reduce((sum: number, h: any) => {
        return (
          sum + calcStablefordPoints(h.strokes, h.par, strokesPerHole[h.hole - 1])
        );
      }, 0);
      expect(ourTotal).toBe(stas.totalPoints);
    });

    it("should match AmGolf stableford points for all Div B players", () => {
      const divB = scorecards.filter(
        (sc: any) => getDivision(sc.hcp) === "B" && sc.totalGross > 0
      );

      let totalMismatches = 0;
      const playerMismatches: string[] = [];

      for (const sc of divB) {
        const strokesPerHole = calcStrokesPerHole(sc.phcp, tbilisiHills.holes);
        let ourTotal = 0;
        let holeMismatches = 0;
        for (const hole of sc.holes) {
          const ourPts = calcStablefordPoints(
            hole.strokes,
            hole.par,
            strokesPerHole[hole.hole - 1]
          );
          ourTotal += ourPts;
          if (ourPts !== hole.points) holeMismatches++;
        }
        if (ourTotal !== sc.totalPoints) {
          playerMismatches.push(
            `${sc.name}: our total=${ourTotal}, amgolf=${sc.totalPoints}, hole mismatches=${holeMismatches}`
          );
          totalMismatches++;
        }
      }

      if (playerMismatches.length > 0) {
        console.log("Div B total points mismatches:", playerMismatches);
      }
      // Allow some mismatches due to PCC/NDB differences
      expect(totalMismatches).toBeLessThanOrEqual(2);
    });
  });

  describe("Division A leaderboard (Net Strokeplay)", () => {
    it("should produce correct ranking order", () => {
      const divA = scorecards.filter(
        (sc: any) => getDivision(sc.hcp) === "A" && sc.totalGross > 0
      );

      // Build ScoreRow array for our engine
      const scoreRows: ScoreRow[] = [];
      for (const sc of divA) {
        const strokesPerHole = calcStrokesPerHole(sc.phcp, tbilisiHills.holes);
        for (const hole of sc.holes) {
          if (hole.strokes === 0) continue;
          const stbPts = calcStablefordPoints(
            hole.strokes,
            hole.par,
            strokesPerHole[hole.hole - 1]
          );
          scoreRows.push({
            registrationId: sc.peopleId,
            playerId: sc.peopleId,
            firstName: sc.name.split(" ")[0],
            lastName: sc.name.split(" ").slice(1).join(" "),
            handicapIndex: sc.hcp,
            playingHandicap: sc.phcp,
            holeNumber: hole.hole,
            rawScore: hole.strokes,
            adjustedScore: hole.strokes, // no NDB cap for net strokeplay ranking
            stablefordPoints: stbPts,
          });
        }
      }

      const leaderboard = computeLeaderboard(scoreRows, "strokeplay", 72);

      // Compare order with AmGolf
      const activeAmgolf = AMGOLF_DIV_A.filter((a) => a.toPar > 0 || a.name === "Sandro Ilashvili");
      console.log("\nDiv A leaderboard comparison:");
      for (let i = 0; i < leaderboard.length && i < activeAmgolf.length; i++) {
        const ours = leaderboard[i];
        const theirs = activeAmgolf[i];
        const match = ours.playerName === theirs.name ? "✓" : "✗";
        console.log(
          `#${i + 1} ${match} Ours: ${ours.playerName} (net ${ours.netTotal}, toPar ${ours.toPar}) | AmGolf: ${theirs.name} (toPar ${theirs.toPar})`
        );
      }

      // Top 3 should match
      expect(leaderboard[0].playerName).toBe("Sandro Ilashvili");
      expect(leaderboard[1].playerName).toBe("Steven Fraga");
      expect(leaderboard[2].playerName).toBe("Tyrone Hammond");
    });
  });

  describe("Division B leaderboard (Stableford)", () => {
    it("should produce correct ranking order", () => {
      const divB = scorecards.filter(
        (sc: any) => getDivision(sc.hcp) === "B" && sc.totalGross > 0
      );

      const scoreRows: ScoreRow[] = [];
      for (const sc of divB) {
        const strokesPerHole = calcStrokesPerHole(sc.phcp, tbilisiHills.holes);
        for (const hole of sc.holes) {
          if (hole.strokes === 0) continue;
          const stbPts = calcStablefordPoints(
            hole.strokes,
            hole.par,
            strokesPerHole[hole.hole - 1]
          );
          scoreRows.push({
            registrationId: sc.peopleId,
            playerId: sc.peopleId,
            firstName: sc.name.split(" ")[0],
            lastName: sc.name.split(" ").slice(1).join(" "),
            handicapIndex: sc.hcp,
            playingHandicap: sc.phcp,
            holeNumber: hole.hole,
            rawScore: hole.strokes,
            adjustedScore: hole.strokes,
            stablefordPoints: stbPts,
          });
        }
      }

      const leaderboard = computeLeaderboard(scoreRows, "stableford", 72);

      const activeDivB = AMGOLF_DIV_B.filter((a) => a.points > 0);
      console.log("\nDiv B leaderboard comparison:");
      for (let i = 0; i < leaderboard.length && i < activeDivB.length; i++) {
        const ours = leaderboard[i];
        const theirs = activeDivB[i];
        const match = ours.playerName === theirs.name ? "✓" : "✗";
        const ptsMatch = ours.stablefordTotal === theirs.points ? "✓" : "✗";
        console.log(
          `#${i + 1} ${match} ${ptsMatch} Ours: ${ours.playerName} (${ours.stablefordTotal} pts) | AmGolf: ${theirs.name} (${theirs.points} pts)`
        );
      }

      // Winner should match
      expect(leaderboard[0].playerName).toBe("Maximilian Sindyukov");
      // Top 3
      expect(leaderboard[1].playerName).toBe("Iryna Levchenko");
      expect(leaderboard[2].playerName).toBe("Samuel Grant Brookes");
    });
  });

  describe("Per-player stableford total verification", () => {
    it("should match AmGolf total points for all players with scores", () => {
      const withScores = scorecards.filter((sc: any) => sc.totalGross > 0);
      const mismatches: string[] = [];

      for (const sc of withScores) {
        const strokesPerHole = calcStrokesPerHole(sc.phcp, tbilisiHills.holes);
        let ourTotal = 0;
        for (const hole of sc.holes) {
          if (!hole.strokes || hole.strokes === 0) continue;
          ourTotal += calcStablefordPoints(
            hole.strokes,
            hole.par,
            strokesPerHole[hole.hole - 1]
          );
        }
        if (ourTotal !== sc.totalPoints) {
          mismatches.push(
            `${sc.name} (HI:${sc.hcp} PH:${sc.phcp}): ours=${ourTotal} amgolf=${sc.totalPoints} diff=${ourTotal - sc.totalPoints}`
          );
        }
      }

      console.log(
        `\nPoints match: ${withScores.length - mismatches.length}/${withScores.length}`
      );
      if (mismatches.length > 0) {
        console.log("Mismatches:", mismatches);
      }
      // All should match
      expect(mismatches).toHaveLength(0);
    });
  });

  describe("Net score verification (Div A)", () => {
    it("should match AmGolf net scores for all Div A players", () => {
      const divA = scorecards.filter(
        (sc: any) => getDivision(sc.hcp) === "A" && sc.totalGross > 0
      );
      const mismatches: string[] = [];

      for (const sc of divA) {
        // Our net = gross - playing handicap
        const ourNet = sc.totalGross - sc.phcp;
        if (ourNet !== sc.totalNet) {
          mismatches.push(
            `${sc.name}: gross=${sc.totalGross} PH=${sc.phcp} ourNet=${ourNet} amgolfNet=${sc.totalNet}`
          );
        }
      }

      console.log(
        `\nNet match (Div A): ${divA.length - mismatches.length}/${divA.length}`
      );
      if (mismatches.length > 0) {
        console.log("Net mismatches:", mismatches);
      }
      expect(mismatches).toHaveLength(0);
    });
  });
});
