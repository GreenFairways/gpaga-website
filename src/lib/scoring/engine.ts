/**
 * Scoring Engine — unified entry point.
 *
 * Dispatches to format-specific strategies.
 * New formats are added by creating a strategy file and registering it here.
 */

import type { TournamentFormat, LeaderboardEntry, FormatConfig, Team, TeamMember } from "@/lib/tournament/types";
import type { ScoringStrategy, ScoringInput, ScoreRow } from "./types";
import { strokeplayStrategy } from "./strategies/strokeplay";
import { stablefordStrategy } from "./strategies/stableford";
import { scrambleStrategy } from "./strategies/scramble";

/** Strategy registry — add new formats here */
const strategies: Partial<Record<TournamentFormat, ScoringStrategy>> = {
  strokeplay: strokeplayStrategy,
  stableford: stablefordStrategy,
  scramble: scrambleStrategy,
};

/** Register a new scoring strategy */
export function registerStrategy(strategy: ScoringStrategy): void {
  strategies[strategy.format] = strategy;
}

/** Get available strategies */
export function getStrategy(format: TournamentFormat): ScoringStrategy | undefined {
  return strategies[format];
}

/**
 * Compute leaderboard for any tournament format.
 *
 * This is the main entry point replacing the old computeLeaderboard.
 * Falls back to strokeplay for unknown formats.
 */
export function computeLeaderboard(
  scores: ScoreRow[],
  format: TournamentFormat,
  coursePar: number,
  config?: FormatConfig,
  teams?: (Team & { members: TeamMember[] })[],
): LeaderboardEntry[] {
  const strategy = strategies[format] ?? strategies.strokeplay!;

  const input: ScoringInput = {
    scores,
    coursePar,
    config,
    teams,
  };

  return strategy.computeLeaderboard(input);
}
