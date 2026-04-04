/**
 * GPAGA Tournament Engine — Type Definitions
 */

// ──── Tournament ────

export type TournamentFormat =
  | "strokeplay"
  | "stableford"
  | "modified_stableford"
  | "par_bogey"
  | "match_play"
  | "scramble"
  | "best_ball"
  | "greensome"
  | "foursomes"
  | "shamble"
  | "skins";

/** Formats that use teams */
export const TEAM_FORMATS: TournamentFormat[] = [
  "scramble",
  "best_ball",
  "greensome",
  "foursomes",
  "shamble",
];

export function isTeamFormat(format: TournamentFormat): boolean {
  return TEAM_FORMATS.includes(format);
}

/** Legacy alias */
export type IndividualFormat = "strokeplay" | "stableford" | "modified_stableford" | "par_bogey";

export type TournamentStatus =
  | "draft"
  | "registration_open"
  | "registration_closed"
  | "in_progress"
  | "suspended"
  | "completed"
  | "cancelled";

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
  divisions: Division[] | null;
  formatConfig: FormatConfig;
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

// ──── Format Config (JSONB in tournaments.format_config) ────

export interface BaseFormatConfig {
  holes?: 9 | 18;
  handicapAllowance?: number; // default 0.95
}

export interface ScrambleConfig extends BaseFormatConfig {
  teamSize: 2 | 3 | 4;
  /** Handicap percentages per player sorted by CH ascending (best first) */
  handicapPercentages: number[];
  /** Minimum drives per player (Texas Scramble), null = no restriction */
  minDrivesPerPlayer?: number | null;
}

export interface BestBallConfig extends BaseFormatConfig {
  teamSize: 2 | 3 | 4;
  /** How many best scores to count per hole (1 = four-ball better ball) */
  bestCount: number;
  /** Per-player handicap allowance (R&A: 85% stroke, 90% match) */
  playerAllowance: number;
}

export interface GreensomeConfig extends BaseFormatConfig {
  /** Handicap formula: 60% lower + 40% higher */
  lowerPct: number; // default 0.6
  higherPct: number; // default 0.4
}

export interface FoursomesConfig extends BaseFormatConfig {
  /** Each player's percentage (R&A: 47.5% for stroke play) */
  playerPct: number; // default 0.475
}

export interface MatchPlayConfig extends BaseFormatConfig {
  bracketSize: 8 | 16 | 32 | 64;
  seeding: "handicap" | "random";
}

export type FormatConfig =
  | (BaseFormatConfig & { format?: "strokeplay" | "stableford" | "par_bogey" | "modified_stableford" })
  | (ScrambleConfig & { format: "scramble" })
  | (BestBallConfig & { format: "best_ball" })
  | (GreensomeConfig & { format: "greensome" })
  | (FoursomesConfig & { format: "foursomes" })
  | (MatchPlayConfig & { format: "match_play" });

/** Default handicap formulas per format */
export const DEFAULT_HANDICAP_FORMULAS: Partial<Record<TournamentFormat, number[]>> = {
  scramble: [0.35, 0.15],           // 2-ball default; 3-ball: [0.20, 0.15, 0.10]; 4-ball: use 25% sum
  best_ball: [0.85],                // 85% each player
  greensome: [0.60, 0.40],         // 60% lower + 40% higher
  foursomes: [0.475, 0.475],       // 47.5% each
};

// ──── Team ────

export interface Team {
  id: string;
  tournamentId: string;
  name: string;
  teamHandicap: number | null;
  seed: number | null;
  createdAt: string;
}

export interface TeamWithMembers extends Team {
  members: TeamMember[];
}

export interface TeamMember {
  registrationId: string;
  playerId: string;
  firstName: string;
  lastName: string;
  handicapIndex: number | null;
  playingHandicap: number | null;
}

// ──── Match (for brackets/match play) ────

export type MatchStatus = "scheduled" | "in_progress" | "completed" | "bye";

export interface Match {
  id: string;
  tournamentId: string;
  roundNumber: number;
  matchNumber: number;
  stage: string; // 'main', 'quarterfinal', 'semifinal', 'final', 'group_A', etc.
  sideAPlayerId: string | null;
  sideATeamId: string | null;
  sideBPlayerId: string | null;
  sideBTeamId: string | null;
  status: MatchStatus;
  winnerPlayerId: string | null;
  winnerTeamId: string | null;
  resultText: string | null; // "3&2", "1 up", "19th hole"
  nextMatchId: string | null;
  loserMatchId: string | null;
  createdAt: string;
}

// ──── Tie-break ────

export type TieBreakMethod = "lower-handicap" | "countback" | "lower-handicap-then-countback";

/** Result of tie-break comparison: -1 = a wins, 0 = still tied, 1 = b wins */
export type TieBreakResult = -1 | 0 | 1;

// ──── Division ────

export interface Division {
  /** e.g. "A", "B", "C" */
  label: string;
  /** Display name e.g. "Division A" */
  name: string;
  format: TournamentFormat;
  /** Number of holes: 18 or 9 */
  holes: 18 | 9;
  /** HCP range [min, max] inclusive */
  hcpRange: [number, number];
  /** Tee box assignment rules */
  tees: DivisionTeeRule[];
  /** Tie-break rule */
  tieBreak: "lower-handicap" | "countback";
}

export interface DivisionTeeRule {
  gender: "M" | "F" | "any";
  /** Optional: minimum age for this tee (e.g. 60 for seniors) */
  seniorAge?: number;
  /** Optional: maximum age for this tee (e.g. 18 for juniors) */
  juniorMaxAge?: number;
  teeName: string;
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
  handicapSource: "gpaga" | "manual" | "amgolf" | "foreign";
  homeClub: string | null;
  amgolfPeopleId: string | null;
  dateOfBirth: string | null;
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
  divisionLabel: string | null;
  teamId: string | null;
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

export type PlayerStatus = "active" | "wd" | "dnf" | "dq" | "dns" | "no_show";

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
  status: PlayerStatus;
  /** For team formats */
  teamId?: string;
  teamName?: string;
  teamMembers?: string[]; // player names
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
