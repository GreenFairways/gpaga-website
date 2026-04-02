import { STANDARD_SLOPE } from "./constants";
import { calcStrokesPerHole } from "./adjustment";
import type { CourseHandicapResult, TeeData, HoleData } from "./types";

/**
 * Calculate Course Handicap (WHS Rule 6.1).
 *
 * Formula: HI × (Slope / 113) + (Course Rating − Par)
 * Rounded to nearest integer.
 */
export function calcCourseHandicap(
  handicapIndex: number,
  slopeRating: number,
  courseRating: number,
  par: number,
): number {
  const raw =
    handicapIndex * (slopeRating / STANDARD_SLOPE) + (courseRating - par);
  return Math.round(raw);
}

/**
 * Calculate Playing Handicap (WHS Rule 6.2).
 *
 * Playing Handicap = Course Handicap × Handicap Allowance, rounded.
 */
export function calcPlayingHandicap(
  courseHandicap: number,
  allowancePercent: number = 1.0,
): number {
  return Math.round(courseHandicap * allowancePercent);
}

/**
 * Full course handicap calculation: Course Handicap, Playing Handicap,
 * and stroke distribution per hole.
 */
export function calcFullCourseHandicap(
  handicapIndex: number,
  tee: TeeData,
  holes: HoleData[],
  allowancePercent: number = 1.0,
): CourseHandicapResult {
  const courseHandicap = calcCourseHandicap(
    handicapIndex,
    tee.slopeRating,
    tee.courseRating,
    tee.par,
  );

  const playingHandicap = calcPlayingHandicap(courseHandicap, allowancePercent);

  const strokesPerHole = calcStrokesPerHole(playingHandicap, holes);

  return {
    courseHandicap,
    playingHandicap,
    allowancePercent,
    strokesPerHole,
  };
}
