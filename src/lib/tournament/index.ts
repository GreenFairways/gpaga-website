/**
 * GPAGA Tournament Engine
 */

export type {
  Tournament,
  TournamentFormat,
  TournamentStatus,
  FlightConfig,
  Player,
  Registration,
  RegistrationStatus,
  RegistrationWithPlayer,
  TournamentScore,
  LeaderboardEntry,
  Flight,
  Group,
  PairingResult,
  MeritEntry,
  MeritResult,
  MeritPointConfig,
} from "./types";

export { generatePairings } from "./pairing";
export type { PairingInput } from "./pairing";
export { processHoleScore, calcStablefordPoints } from "./scoring";
export { computeLeaderboard } from "./leaderboard";
export { computeOrderOfMerit, DEFAULT_MERIT_POINTS } from "./merit";
export { generateAccessCode, calcRegistrationHandicap } from "./registration";
