/**
 * Tournament Scoring Engine
 *
 * Integrates with the WHS handicap engine for:
 * - Net Double Bogey adjustment
 * - Stableford point calculation
 */

import { getCourse } from "@/data/courses";
import { calcStrokesPerHole, calcNetDoubleBogey } from "@/lib/handicap";
import type { TournamentFormat } from "./types";

export interface ScoreProcessResult {
  adjustedScore: number;
  stablefordPoints: number | null;
}

/**
 * Process a single hole score.
 *
 * Caps at Net Double Bogey and computes Stableford points if applicable.
 */
export function processHoleScore(
  holeNumber: number,
  rawScore: number,
  playingHandicap: number,
  courseId: string,
  format: TournamentFormat,
): ScoreProcessResult {
  const course = getCourse(courseId);
  if (!course) {
    return { adjustedScore: rawScore, stablefordPoints: null };
  }

  const strokesPerHole = calcStrokesPerHole(playingHandicap, course.holes);
  const hole = course.holes[holeNumber - 1];
  if (!hole) {
    return { adjustedScore: rawScore, stablefordPoints: null };
  }

  const strokes = strokesPerHole[holeNumber - 1];
  const ndb = calcNetDoubleBogey(hole.par, strokes);
  const adjustedScore = Math.min(rawScore, ndb);

  let stablefordPoints: number | null = null;
  if (format === "stableford") {
    // Stableford: points based on net score vs par
    // Net score = raw score - strokes received on this hole
    const netScore = rawScore - strokes;
    const diff = hole.par - netScore;
    // +2 baseline: par = 2 points, birdie = 3, eagle = 4, bogey = 1, double+ = 0
    stablefordPoints = Math.max(0, diff + 2);
  }

  return { adjustedScore, stablefordPoints };
}

/**
 * Compute stableford points for a given score on a hole.
 * Exported for testing.
 */
export function calcStablefordPoints(
  rawScore: number,
  par: number,
  handicapStrokes: number,
): number {
  const netScore = rawScore - handicapStrokes;
  const diff = par - netScore;
  return Math.max(0, diff + 2);
}
