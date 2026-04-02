/**
 * GPAGA Handicap Calculation Engine
 *
 * Pure TypeScript implementation of the World Handicap System (WHS).
 * No framework dependencies.
 */

// --- Types ---
export type {
  HoleData,
  TeeData,
  CourseData,
  RoundScore,
  HandicapResult,
  CourseHandicapResult,
  DifferentialSelection,
} from "./types";

// --- Constants ---
export {
  STANDARD_SLOPE,
  MAX_HANDICAP_INDEX,
  INDEX_MULTIPLIER,
  SOFT_CAP_THRESHOLD,
  HARD_CAP_THRESHOLD,
  DIFFERENTIAL_TABLE,
  getDifferentialSelection,
} from "./constants";

// --- Score Differential ---
export { calcScoreDifferential } from "./differential";

// --- Score Adjustment (Net Double Bogey) ---
export {
  calcStrokesPerHole,
  calcNetDoubleBogey,
  adjustScores,
} from "./adjustment";

// --- Handicap Index ---
export { calcHandicapIndex } from "./index-calc";

// --- Course Handicap ---
export {
  calcCourseHandicap,
  calcPlayingHandicap,
  calcFullCourseHandicap,
} from "./course-handicap";

// --- Safeguards ---
export { applySafeguards } from "./safeguards";

// --- Nine-Hole Pairing ---
export {
  combineNineHoleDifferentials,
  buildEffectiveDifferentials,
} from "./nine-hole";

// --- Validators ---
export { validateHoleScore, validateRoundScores } from "./validators";
