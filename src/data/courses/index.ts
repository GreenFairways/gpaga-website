import type { CourseData } from "@/lib/handicap/types";
import { tbilisiHills } from "./tbilisi-hills";
import { taboriParagraph } from "./tabori-paragraph";
import { ambassadoriKachreti } from "./ambassadori-kachreti";

/** All registered courses keyed by id */
export const courses: Record<string, CourseData> = {
  [tbilisiHills.id]: tbilisiHills,
  [taboriParagraph.id]: taboriParagraph,
  [ambassadoriKachreti.id]: ambassadoriKachreti,
};

/** Look up a course by its id. Returns undefined if not found. */
export function getCourse(id: string): CourseData | undefined {
  return courses[id];
}

export { tbilisiHills, taboriParagraph, ambassadoriKachreti };
