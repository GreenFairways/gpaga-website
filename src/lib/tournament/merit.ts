/**
 * Order of Merit — season-long ranking system.
 *
 * Points are awarded based on finishing position in completed tournaments.
 * Configurable point schedule with participation bonus.
 */

import type { MeritPointConfig, MeritEntry, MeritResult } from "./types";

/** Default GPAGA point schedule */
export const DEFAULT_MERIT_POINTS: MeritPointConfig = {
  positions: [
    100, 80, 65, 55, 50, 45, 40, 36, 33, 30, // 1st-10th
    28, 26, 24, 22, 20, 18, 16, 14, 12, 10,   // 11th-20th
    9, 8, 7, 6, 5, 4, 3, 2, 1,                // 21st-29th
  ],
  participationPoints: 5,
};

interface TournamentResult {
  tournamentId: string;
  tournamentName: string;
  tournamentDate: string;
  playerId: string;
  playerName: string;
  position: number;
}

/**
 * Compute Order of Merit from completed tournament results.
 */
export function computeOrderOfMerit(
  results: TournamentResult[],
  config: MeritPointConfig = DEFAULT_MERIT_POINTS,
): MeritEntry[] {
  const byPlayer = new Map<
    string,
    { name: string; results: MeritResult[]; bestFinish: number }
  >();

  for (const r of results) {
    if (!byPlayer.has(r.playerId)) {
      byPlayer.set(r.playerId, {
        name: r.playerName,
        results: [],
        bestFinish: Infinity,
      });
    }

    const entry = byPlayer.get(r.playerId)!;
    const points =
      r.position <= config.positions.length
        ? config.positions[r.position - 1]
        : config.participationPoints;

    entry.results.push({
      tournamentId: r.tournamentId,
      tournamentName: r.tournamentName,
      position: r.position,
      points,
      date: r.tournamentDate,
    });

    if (r.position < entry.bestFinish) {
      entry.bestFinish = r.position;
    }
  }

  const entries: MeritEntry[] = [];
  for (const [playerId, data] of byPlayer) {
    entries.push({
      playerId,
      playerName: data.name,
      totalPoints: data.results.reduce((sum, r) => sum + r.points, 0),
      tournamentsPlayed: data.results.length,
      bestFinish: data.bestFinish === Infinity ? 0 : data.bestFinish,
      results: data.results.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    });
  }

  // Sort by total points descending, then best finish ascending
  entries.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    return a.bestFinish - b.bestFinish;
  });

  return entries;
}
