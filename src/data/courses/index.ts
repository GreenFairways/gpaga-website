import type { CourseData } from "@/lib/handicap/types";
import { tbilisiHills } from "./tbilisi-hills";
import { taboriParagraph } from "./tabori-paragraph";

/** All registered courses keyed by id */
export const courses: Record<string, CourseData> = {
  [tbilisiHills.id]: tbilisiHills,
  [taboriParagraph.id]: taboriParagraph,
};

/** Look up a course by its id. Returns undefined if not found. */
export function getCourse(id: string): CourseData | undefined {
  return courses[id];
}

export { tbilisiHills, taboriParagraph };
