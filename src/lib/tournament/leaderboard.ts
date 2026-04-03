/**
 * Leaderboard computation — delegates to scoring engine.
 *
 * This file maintains backwards compatibility with existing imports.
 * New code should use `@/lib/scoring` directly.
 */

import type { TournamentFormat, LeaderboardEntry } from "./types";
import { computeLeaderboard as engineCompute } from "@/lib/scoring/engine";
import type { ScoreRow } from "@/lib/scoring/types";

/**
 * Build leaderboard from raw score rows.
 *
 * @deprecated Use `computeLeaderboard` from `@/lib/scoring` instead.
 */
export function computeLeaderboard(
  scores: ScoreRow[],
  format: TournamentFormat,
  coursePar: number,
): LeaderboardEntry[] {
  return engineCompute(scores, format, coursePar);
}
