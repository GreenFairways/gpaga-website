/**
 * Scoring Engine Types
 */

import type {
  TournamentFormat,
  FormatConfig,
  LeaderboardEntry,
  Team,
  TeamMember,
} from "@/lib/tournament/types";

/** Raw score row from DB join */
export interface ScoreRow {
  registrationId: string;
  playerId: string;
  firstName: string;
  lastName: string;
  handicapIndex: number | null;
  playingHandicap: number;
  holeNumber: number;
  rawScore: number;
  adjustedScore: number;
  stablefordPoints: number | null;
  /** For team formats */
  teamId?: string;
  teamName?: string;
}

/** Input to a scoring strategy */
export interface ScoringInput {
  scores: ScoreRow[];
  coursePar: number;
  config?: FormatConfig;
  teams?: (Team & { members: TeamMember[] })[];
  roundNumber?: number;
}

/** A scoring strategy computes leaderboard for a specific format */
export interface ScoringStrategy {
  readonly format: TournamentFormat;
  readonly isTeamFormat: boolean;
  computeLeaderboard(input: ScoringInput): LeaderboardEntry[];
}

/** Sort comparator: negative = a ranks higher, positive = b ranks higher */
export type SortComparator = (a: LeaderboardEntry, b: LeaderboardEntry) => number;
