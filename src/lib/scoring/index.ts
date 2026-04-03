/**
 * Scoring Engine — public API
 */

export { computeLeaderboard, registerStrategy, getStrategy } from "./engine";
export type { ScoringStrategy, ScoringInput, ScoreRow } from "./types";
export { tieBreak } from "./helpers/tiebreak";
export { assignPositions } from "./helpers/positions";
