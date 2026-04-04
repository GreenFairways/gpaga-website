import type { CourseData } from "@/lib/handicap/types";

/**
 * Ambassadori Kachreti Golf Resort
 * 9 physical holes, played as 18 (Par 72 = 36 × 2).
 * Designed by Graham Cooke (2014).
 * Located in Kakheti wine region, ~80km from Tbilisi.
 *
 * Scorecard data: official Clere Golf scorecard (Ref: 51634), received 2026-04-03.
 * Slope ratings (Men): from Ambassadori HCP chart (unofficial estimates) — White 109, Yellow 104, Blue 99.
 * CR values and Red tee slope are still provisional estimates — no official WHS rating available yet.
 */
export const ambassadoriKachreti: CourseData = {
  id: "ambassadori-kachreti",
  name: "Ambassadori Kachreti Golf Resort",
  location: "Kachreti, Kakheti, Georgia",
  physicalHoles: 9,
  par: 72, // 36 × 2 for 18-hole round
  tees: [
    {
      name: "White",
      color: "#FFFFFF",
      totalDistance: 5490, // 2745 × 2
      courseRating: 70.2,
      slopeRating: 109,
      par: 72,
      ratingProvisional: true,
      gender: "M",
    },
    {
      name: "Yellow",
      color: "#F9A825",
      totalDistance: 5072, // 2536 × 2
      courseRating: 68.4,
      slopeRating: 104,
      par: 72,
      ratingProvisional: true,
      gender: "M",
    },
    {
      name: "Blue",
      color: "#1E88E5",
      totalDistance: 4568, // 2284 × 2
      courseRating: 66.0,
      slopeRating: 99,
      par: 72,
      ratingProvisional: true,
      gender: "M",
    },
    {
      name: "Red",
      color: "#E53935",
      totalDistance: 4146, // 2073 × 2
      courseRating: 68.0,
      slopeRating: 118,
      par: 72,
      ratingProvisional: true,
      gender: "F",
    },
  ],
  holes: [
    // Front 9 (OUT)
    { number: 1,  par: 4, strokeIndex: 15, distances: { White: 293, Yellow: 293, Blue: 278, Red: 241 } },
    { number: 2,  par: 3, strokeIndex: 5,  distances: { White: 167, Yellow: 144, Blue: 115, Red: 85 } },
    { number: 3,  par: 4, strokeIndex: 9,  distances: { White: 309, Yellow: 306, Blue: 287, Red: 273 } },
    { number: 4,  par: 4, strokeIndex: 17, distances: { White: 260, Yellow: 243, Blue: 216, Red: 194 } },
    { number: 5,  par: 3, strokeIndex: 7,  distances: { White: 183, Yellow: 166, Blue: 137, Red: 133 } },
    { number: 6,  par: 4, strokeIndex: 3,  distances: { White: 316, Yellow: 293, Blue: 261, Red: 227 } },
    { number: 7,  par: 5, strokeIndex: 1,  distances: { White: 442, Yellow: 394, Blue: 370, Red: 348 } },
    { number: 8,  par: 5, strokeIndex: 11, distances: { White: 486, Yellow: 436, Blue: 388, Red: 354 } },
    { number: 9,  par: 4, strokeIndex: 13, distances: { White: 289, Yellow: 261, Blue: 232, Red: 218 } },
    // Back 9 (IN) — same physical holes, different SI
    { number: 10, par: 4, strokeIndex: 16, distances: { White: 293, Yellow: 293, Blue: 278, Red: 241 } },
    { number: 11, par: 3, strokeIndex: 6,  distances: { White: 167, Yellow: 144, Blue: 115, Red: 85 } },
    { number: 12, par: 4, strokeIndex: 10, distances: { White: 309, Yellow: 306, Blue: 287, Red: 273 } },
    { number: 13, par: 4, strokeIndex: 18, distances: { White: 260, Yellow: 243, Blue: 216, Red: 194 } },
    { number: 14, par: 3, strokeIndex: 8,  distances: { White: 183, Yellow: 166, Blue: 137, Red: 133 } },
    { number: 15, par: 4, strokeIndex: 4,  distances: { White: 316, Yellow: 293, Blue: 261, Red: 227 } },
    { number: 16, par: 5, strokeIndex: 2,  distances: { White: 442, Yellow: 394, Blue: 370, Red: 348 } },
    { number: 17, par: 5, strokeIndex: 12, distances: { White: 486, Yellow: 436, Blue: 388, Red: 354 } },
    { number: 18, par: 4, strokeIndex: 14, distances: { White: 289, Yellow: 261, Blue: 232, Red: 218 } },
  ],
};
