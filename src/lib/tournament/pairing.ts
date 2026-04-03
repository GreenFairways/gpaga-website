/**
 * GPAGA Tournament Pairing Algorithm
 *
 * 1. Sort registrations by playing handicap ascending
 * 2. Divide into flights by handicap bands
 * 3. Within each flight, snake-draft into groups of 3-4
 * 4. Assign tee times with configurable intervals
 */

import type {
  Flight,
  Group,
  PairingResult,
  FlightConfig,
  RegistrationWithPlayer,
} from "./types";

const FLIGHT_LABELS = ["A", "B", "C", "D", "E", "F"];

export interface PairingInput {
  registrations: RegistrationWithPlayer[];
  flightConfig: FlightConfig | null;
  startTime: string; // "08:00"
  intervalMinutes: number; // 8 or 10
}

/** Determine number of flights based on player count */
export function autoFlightCount(playerCount: number): number {
  if (playerCount < 20) return 1;
  if (playerCount <= 40) return 2;
  if (playerCount <= 60) return 3;
  return 4;
}

/** Parse "HH:MM" to minutes since midnight */
function parseTime(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** Format minutes since midnight to "HH:MM" */
function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

/** Sort registrations by playing handicap (nulls last) */
export function sortByHandicap(
  regs: RegistrationWithPlayer[],
): RegistrationWithPlayer[] {
  return [...regs].sort((a, b) => {
    const ha = a.playingHandicap ?? 999;
    const hb = b.playingHandicap ?? 999;
    return ha - hb;
  });
}

/** Split sorted registrations into flights */
export function buildFlights(
  sorted: RegistrationWithPlayer[],
  config: FlightConfig | null,
): Flight[] {
  if (!config || config.mode === "auto") {
    const count = config?.count || autoFlightCount(sorted.length);
    const perFlight = Math.ceil(sorted.length / count);
    const flights: Flight[] = [];

    for (let i = 0; i < count; i++) {
      const slice = sorted.slice(i * perFlight, (i + 1) * perFlight);
      if (slice.length === 0) break;

      const handicaps = slice
        .map((r) => r.playingHandicap ?? 54)
        .sort((a, b) => a - b);

      flights.push({
        number: i + 1,
        label: FLIGHT_LABELS[i] || `F${i + 1}`,
        handicapMin: handicaps[0],
        handicapMax: handicaps[handicaps.length - 1],
        registrationIds: slice.map((r) => r.id),
      });
    }

    return flights;
  }

  // Manual mode with custom boundaries
  const flights: Flight[] = [];
  const boundaries = config.boundaries || [];
  const used = new Set<string>();

  boundaries.forEach(([min, max], i) => {
    const slice = sorted.filter((r) => {
      const h = r.playingHandicap ?? 54;
      return h >= min && h <= max && !used.has(r.id);
    });
    slice.forEach((r) => used.add(r.id));

    if (slice.length > 0) {
      flights.push({
        number: i + 1,
        label: FLIGHT_LABELS[i] || `F${i + 1}`,
        handicapMin: min,
        handicapMax: max,
        registrationIds: slice.map((r) => r.id),
      });
    }
  });

  // Unassigned players go to last flight
  const unassigned = sorted.filter((r) => !used.has(r.id));
  if (unassigned.length > 0) {
    if (flights.length > 0) {
      flights[flights.length - 1].registrationIds.push(
        ...unassigned.map((r) => r.id),
      );
    } else {
      flights.push({
        number: 1,
        label: "A",
        handicapMin: 0,
        handicapMax: 54,
        registrationIds: unassigned.map((r) => r.id),
      });
    }
  }

  return flights;
}

/**
 * Snake-draft N players into groups of 3-4.
 *
 * Determines number of groups, then fills them via snake ordering
 * so each group gets a mix of low and high handicaps.
 *
 * For 8 players sorted [1,2,3,4,5,6,7,8]:
 *   Group 1: 1, 4, 5, 8
 *   Group 2: 2, 3, 6, 7
 */
export function buildGroups(
  registrationIds: string[],
  flightNumber: number,
  startGroupNumber: number,
): Group[] {
  const n = registrationIds.length;
  if (n === 0) return [];
  if (n <= 4) {
    return [
      {
        number: startGroupNumber,
        flightNumber,
        teeTime: "",
        registrationIds: [...registrationIds],
      },
    ];
  }

  // Determine how many groups and their sizes
  // Prefer groups of 4, allow groups of 3 for remainders
  const numGroups = Math.ceil(n / 4);
  const groupSizes: number[] = [];

  let remaining = n;
  for (let i = 0; i < numGroups; i++) {
    const groupsLeft = numGroups - i;
    const size = Math.ceil(remaining / groupsLeft);
    groupSizes.push(size);
    remaining -= size;
  }

  // Snake-draft into groups
  const slots: string[][] = Array.from({ length: numGroups }, () => []);
  let idx = 0;
  let direction = 1;

  for (const regId of registrationIds) {
    slots[idx].push(regId);

    // Check if we need to bounce
    const nextIdx = idx + direction;
    if (nextIdx >= numGroups || nextIdx < 0) {
      direction = -direction;
    } else {
      idx = nextIdx;
    }
  }

  return slots.map((ids, i) => ({
    number: startGroupNumber + i,
    flightNumber,
    teeTime: "",
    registrationIds: ids,
  }));
}

/** Main pairing function */
export function generatePairings(input: PairingInput): PairingResult {
  const { registrations, flightConfig, startTime, intervalMinutes } = input;

  // Filter to eligible only
  const eligible = registrations.filter(
    (r) => r.status === "registered" || r.status === "confirmed",
  );

  const sorted = sortByHandicap(eligible);
  const flights = buildFlights(sorted, flightConfig);

  // Build groups within each flight
  const allGroups: Group[] = [];
  let groupCounter = 1;

  for (const flight of flights) {
    const groups = buildGroups(
      flight.registrationIds,
      flight.number,
      groupCounter,
    );
    allGroups.push(...groups);
    groupCounter += groups.length;
  }

  // Assign tee times
  let currentTime = parseTime(startTime);
  for (const group of allGroups) {
    group.teeTime = formatTime(currentTime);
    currentTime += intervalMinutes;
  }

  return { flights, groups: allGroups };
}
