/**
 * Stableford Strategy
 *
 * Sort by stableford points descending (highest wins).
 * Tiebreak: lower handicap, then countback 9/6/3/1.
 */

import type { LeaderboardEntry } from "@/lib/tournament/types";
import type { ScoringStrategy, ScoringInput } from "../types";
import { assignPositions } from "../helpers/positions";
import { buildIndividualEntries } from "./strokeplay";

export const stablefordStrategy: ScoringStrategy = {
  format: "stableford",
  isTeamFormat: false,

  computeLeaderboard(input: ScoringInput): LeaderboardEntry[] {
    const entries = buildIndividualEntries(input.scores, input.coursePar, true);
    return assignPositions(
      entries,
      (a, b) => (b.stablefordTotal ?? 0) - (a.stablefordTotal ?? 0),
      "stableford",
    );
  },
};
