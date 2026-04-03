/**
 * Assign leaderboard positions with tie handling + tiebreak.
 */

import type { LeaderboardEntry, TournamentFormat } from "@/lib/tournament/types";
import type { SortComparator } from "../types";
import { tieBreak } from "./tiebreak";

/**
 * Sort entries by primary comparator, apply tiebreak, assign positions.
 */
export function assignPositions(
  entries: LeaderboardEntry[],
  primarySort: SortComparator,
  format: TournamentFormat,
): LeaderboardEntry[] {
  // Primary sort
  entries.sort(primarySort);

  // Apply tiebreak within groups of equal primary score
  const groups: LeaderboardEntry[][] = [];
  let currentGroup: LeaderboardEntry[] = [];

  for (let i = 0; i < entries.length; i++) {
    if (i === 0) {
      currentGroup = [entries[i]];
    } else if (primarySort(entries[i - 1], entries[i]) === 0) {
      currentGroup.push(entries[i]);
    } else {
      groups.push(currentGroup);
      currentGroup = [entries[i]];
    }
  }
  if (currentGroup.length > 0) groups.push(currentGroup);

  // Sort within tied groups using tiebreak
  const sorted: LeaderboardEntry[] = [];
  for (const group of groups) {
    if (group.length > 1) {
      group.sort((a, b) => tieBreak(a, b, format));
    }
    sorted.push(...group);
  }

  // Assign positions
  for (let i = 0; i < sorted.length; i++) {
    if (i === 0) {
      sorted[i].position = 1;
      sorted[i].tied = false;
    } else {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      const sameScore = primarySort(prev, curr) === 0;
      const sameTieBreak = sameScore && tieBreak(prev, curr, format) === 0;

      if (sameTieBreak) {
        curr.position = prev.position;
        curr.tied = true;
        prev.tied = true;
      } else {
        curr.position = i + 1;
        curr.tied = false;
      }
    }
  }

  return sorted;
}
