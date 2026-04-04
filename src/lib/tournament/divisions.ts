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
      { gender: "M", teeName: "White", seniorAge: 60 },
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
      { gender: "M", teeName: "White", seniorAge: 60 },
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
 * Calculate age in years from date of birth on a given date.
 */
function calcAge(dateOfBirth: string, onDate: string): number {
  const dob = new Date(dateOfBirth);
  const ref = new Date(onDate);
  let age = ref.getFullYear() - dob.getFullYear();
  const monthDiff = ref.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && ref.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

/**
 * Get tee name for a player in a division based on gender and age.
 *
 * Matching priority:
 * 1. Senior rule: gender matches AND player age >= seniorAge
 * 2. Gender-specific rule (no seniorAge)
 * 3. Fallback: "any" gender, then first rule
 */
export function getTeeForPlayer(
  division: Division,
  gender: "M" | "F",
  dateOfBirth?: string | null,
  tournamentDate?: string,
): string {
  const age =
    dateOfBirth && tournamentDate
      ? calcAge(dateOfBirth, tournamentDate)
      : null;

  // 1. Check age-based rules (senior or junior)
  if (age != null) {
    // Junior rule: player age <= juniorMaxAge
    const juniorRule = division.tees.find(
      (t) =>
        t.juniorMaxAge != null &&
        age <= t.juniorMaxAge &&
        (t.gender === gender || t.gender === "any"),
    );
    if (juniorRule) return juniorRule.teeName;

    // Senior rule: player age >= seniorAge
    const seniorRule = division.tees.find(
      (t) =>
        t.seniorAge != null &&
        t.seniorAge > 0 &&
        age >= t.seniorAge &&
        (t.gender === gender || t.gender === "any"),
    );
    if (seniorRule) return seniorRule.teeName;
  }

  // 2. Gender-specific rule (no seniorAge)
  const genderRule = division.tees.find(
    (t) => t.gender === gender && !t.seniorAge,
  );
  if (genderRule) return genderRule.teeName;

  // 3. Fallback
  const anyRule = division.tees.find((t) => t.gender === "any" && !t.seniorAge);
  return anyRule?.teeName ?? division.tees[0]?.teeName ?? "White";
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
