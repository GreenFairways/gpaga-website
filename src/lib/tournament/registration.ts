/**
 * Registration logic — handicap calculation at registration time.
 */

import { getCourse } from "@/data/courses";
import { calcFullCourseHandicap } from "@/lib/handicap";
import type { TeeData, HoleData } from "@/lib/handicap/types";

/** Generate a 12-character alphanumeric access code (HIGH: increased from 6 for entropy) */
export function generateAccessCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1 for readability
  let code = "";
  for (let i = 0; i < 12; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/** Calculate course and playing handicap for a registration */
export function calcRegistrationHandicap(
  handicapIndex: number | null,
  courseId: string,
  teeName: string,
  gender: "M" | "F",
  handicapAllowance: number,
): { courseHandicap: number | null; playingHandicap: number | null } {
  if (handicapIndex == null) return { courseHandicap: null, playingHandicap: null };

  const course = getCourse(courseId);
  if (!course) return { courseHandicap: null, playingHandicap: null };

  // Find the tee matching name and gender
  let tee = course.tees.find(
    (t: TeeData) =>
      t.name === teeName && (t.gender === gender || t.gender === "Mixed"),
  );
  // Fallback: if tee not available for this gender, use first tee for their gender
  if (!tee) {
    tee = course.tees.find(
      (t: TeeData) => t.gender === gender || t.gender === "Mixed",
    );
  }
  if (!tee) return { courseHandicap: null, playingHandicap: null };

  const result = calcFullCourseHandicap(
    handicapIndex,
    tee,
    course.holes as HoleData[],
    handicapAllowance,
  );

  return {
    courseHandicap: result.courseHandicap,
    playingHandicap: result.playingHandicap,
  };
}
