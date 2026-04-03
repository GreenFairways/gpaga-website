/**
 * GPAGA Tournament Engine — Type Definitions
 */

// ──── Tournament ────

export type TournamentFormat = "strokeplay" | "stableford" | "matchplay";
export type TournamentStatus =
  | "draft"
  | "registration_open"
  | "registration_closed"
  | "in_progress"
  | "completed";

export interface Tournament {
  id: string;
  name: string;
  date: string; // ISO date
  courseId: string;
  teeName: string;
  gender: "M" | "F" | "Mixed";
  format: TournamentFormat;
  status: TournamentStatus;
  maxPlayers: number;
  entryFeeLari: number;
  rules: string; // markdown
  handicapAllowance: number; // e.g. 0.95 for 95%
  flightConfig: FlightConfig | null;
  createdAt: string;
  updatedAt: string;
}

export interface FlightConfig {
  mode: "auto" | "manual";
  /** For auto mode: number of flights (2-4). Players split evenly by handicap. */
  count: number;
  /** For manual mode: custom boundaries e.g. [[0,12],[13,24],[25,54]] */
  boundaries?: [number, number][];
}

// ──── Player ────

export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  gender: "M" | "F";
  handicapIndex: number | null;
  handicapSource: "gpaga" | "manual" | "foreign";
  homeClub: string | null;
  createdAt: string;
}

// ──── Registration ────

export type RegistrationStatus =
  | "registered"
  | "confirmed"
  | "withdrawn"
  | "waitlist";

export interface Registration {
  id: string;
  tournamentId: string;
  playerId: string;
  status: RegistrationStatus;
  handicapIndexAtReg: number | null;
  courseHandicap: number | null;
  playingHandicap: number | null;
  flightNumber: number | null;
  groupNumber: number | null;
  teeTime: string | null; // "08:30"
  registeredAt: string;
  accessCode: string;
}

/** Registration with player info joined */
export interface RegistrationWithPlayer extends Registration {
  firstName: string;
  lastName: string;
  email: string;
  gender: "M" | "F";
}

// ──── Score ────

export interface TournamentScore {
  id: string;
  registrationId: string;
  holeNumber: number; // 1-18
  rawScore: number;
  adjustedScore: number;
  stablefordPoints: number | null;
  enteredBy: "admin" | "player";
  enteredAt: string;
}

// ──── Leaderboard ────

export interface LeaderboardEntry {
  position: number;
  tied: boolean;
  playerId: string;
  playerName: string;
  handicapIndex: number | null;
  playingHandicap: number;
  holesCompleted: number;
  grossTotal: number;
  netTotal: number;
  toPar: number;
  stablefordTotal: number | null;
  thru: number;
  holeScores: (number | null)[]; // 18 slots, null = not played
}

// ──── Flight / Group ────

export interface Flight {
  number: number;
  label: string; // "A", "B", "C", "D"
  handicapMin: number;
  handicapMax: number;
  registrationIds: string[];
}

export interface Group {
  number: number;
  flightNumber: number;
  teeTime: string; // "08:00"
  registrationIds: string[];
}

export interface PairingResult {
  flights: Flight[];
  groups: Group[];
}

// ──── Order of Merit ────

export interface MeritPointConfig {
  positions: number[]; // points per position: [100, 75, 60, 50, 45, 40, ...]
  participationPoints: number; // points just for participating
}

export interface MeritEntry {
  playerId: string;
  playerName: string;
  totalPoints: number;
  tournamentsPlayed: number;
  bestFinish: number;
  results: MeritResult[];
}

export interface MeritResult {
  tournamentId: string;
  tournamentName: string;
  position: number;
  points: number;
  date: string;
}
