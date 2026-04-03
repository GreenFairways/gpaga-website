/**
 * Division presets and helpers.
 */

import type { Division, TournamentFormat } from "./types";

/**
 * Tbilisi Hills standard format (from club PDF):
 * - Division A: Net Strokeplay, 18 holes, HCP 0-18
 * - Division B: Stableford, 18 holes, HCP 18.1-36
 * - Division C: Stableford, 9 holes, HCP 36.1-54
 *
 * Tees: Men 0-36 Silver, Men 36.1-54 White, Women Green, Senior 60+ White
 */
export const TBILISI_HILLS_PRESET: Division[] = [
  {
    label: "A",
    name: "Division A",
    format: "strokeplay",
    holes: 18,
    hcpRange: [0, 18],
    tees: [
      { gender: "M", teeName: "Silver" },
      { gender: "F", teeName: "Green" },
    ],
    tieBreak: "lower-handicap",
  },
  {
    label: "B",
    name: "Division B",
    format: "stableford",
    holes: 18,
    hcpRange: [18.1, 36],
    tees: [
      { gender: "M", teeName: "Silver" },
      { gender: "F", teeName: "Green" },
    ],
    tieBreak: "lower-handicap",
  },
  {
    label: "C",
    name: "Division C",
    format: "stableford",
    holes: 9,
    hcpRange: [36.1, 54],
    tees: [
      { gender: "M", teeName: "White" },
      { gender: "F", teeName: "Green" },
    ],
    tieBreak: "lower-handicap",
  },
];

/**
 * Determine which division a player belongs to based on HCP.
 * Returns null if no matching division.
 */
export function assignDivision(
  divisions: Division[],
  handicapIndex: number | null,
): Division | null {
  if (handicapIndex == null) return null;

  for (const div of divisions) {
    if (handicapIndex >= div.hcpRange[0] && handicapIndex <= div.hcpRange[1]) {
      return div;
    }
  }

  // Edge: player HCP exceeds all ranges — put in last division
  if (divisions.length > 0) {
    return divisions[divisions.length - 1];
  }

  return null;
}

/**
 * Get tee name for a player in a division based on gender.
 */
export function getTeeForPlayer(
  division: Division,
  gender: "M" | "F",
): string {
  // Find gender-specific rule first, then fallback to "any"
  const rule =
    division.tees.find((t) => t.gender === gender) ||
    division.tees.find((t) => t.gender === "any") ||
    division.tees[0];

  return rule?.teeName ?? "White";
}

/** Available presets for admin UI */
export const DIVISION_PRESETS: { id: string; name: string; divisions: Division[] }[] = [
  {
    id: "tbilisi-hills",
    name: "Tbilisi Hills Standard (A/B/C)",
    divisions: TBILISI_HILLS_PRESET,
  },
  {
    id: "two-div",
    name: "Two Divisions (0-24 / 24.1-54)",
    divisions: [
      {
        label: "A",
        name: "Division A",
        format: "strokeplay",
        holes: 18,
        hcpRange: [0, 24],
        tees: [
          { gender: "M", teeName: "Silver" },
          { gender: "F", teeName: "Green" },
        ],
        tieBreak: "lower-handicap",
      },
      {
        label: "B",
        name: "Division B",
        format: "stableford",
        holes: 18,
        hcpRange: [24.1, 54],
        tees: [
          { gender: "M", teeName: "White" },
          { gender: "F", teeName: "Green" },
        ],
        tieBreak: "lower-handicap",
      },
    ],
  },
  {
    id: "single-stableford",
    name: "Single Division (Stableford)",
    divisions: [
      {
        label: "A",
        name: "Open",
        format: "stableford",
        holes: 18,
        hcpRange: [0, 54],
        tees: [
          { gender: "M", teeName: "Silver" },
          { gender: "F", teeName: "Green" },
        ],
        tieBreak: "lower-handicap",
      },
    ],
  },
];
