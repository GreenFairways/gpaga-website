/** A single hole on a golf course */
export interface HoleData {
  number: number;
  par: number;
  strokeIndex: number;
  distances: Record<string, number>; // tee name -> meters
  elevation?: number;
}

/** A tee set on a course */
export interface TeeData {
  name: string;
  color: string;
  totalDistance: number; // meters
  courseRating: number;
  slopeRating: number;
  par: number;
  ratingProvisional: boolean;
  gender: "M" | "F" | "Mixed";
}

/** A golf course */
export interface CourseData {
  id: string;
  name: string;
  location: string;
  physicalHoles: number; // 9 or 18
  par: number;
  tees: TeeData[];
  holes: HoleData[]; // always 18 entries for handicap
}

/** A player's score for a single round */
export interface RoundScore {
  id: string;
  date: string; // ISO date
  courseId: string;
  teeName: string;
  gender: "M" | "F";
  holeScores: number[]; // raw scores
  adjustedScores: number[]; // after Net Double Bogey
  adjustedGross: number;
  scoreDifferential: number;
  pcc: number;
  isNineHole: boolean;
  notes?: string;
}

/** Result of a handicap index calculation */
export interface HandicapResult {
  index: number;
  differentialsUsed: number;
  differentialsAvailable: number;
  adjustment: number;
  rawAverage: number;
  softCapApplied: boolean;
  hardCapApplied: boolean;
  lowIndex: number | null;
}

/** Result of a course handicap calculation */
export interface CourseHandicapResult {
  courseHandicap: number;
  playingHandicap: number;
  allowancePercent: number;
  strokesPerHole: number[];
}

/** Differential selection table entry */
export interface DifferentialSelection {
  count: number; // how many best differentials to use
  adjustment: number; // additional adjustment
}
