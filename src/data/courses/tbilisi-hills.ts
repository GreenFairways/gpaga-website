import type { CourseData } from "@/lib/handicap/types";

/**
 * Tbilisi Hills Golf Club
 * 18 holes, Par 72. Official data from 2020 scorecard.
 *
 * SI verified against AmGolf live tournament data (GPAGA Season Opening 2026).
 * Original PDF had duplicates which have been corrected to match actual SI used
 * by the club's scoring system.
 */
export const tbilisiHills: CourseData = {
  id: "tbilisi-hills",
  name: "Tbilisi Hills Golf Club",
  location: "Tbilisi, Georgia",
  physicalHoles: 18,
  par: 72,
  tees: [
    // ── Men ──
    {
      name: "Gold",
      color: "#C5A028",
      totalDistance: 6223,
      courseRating: 73.9,
      slopeRating: 139,
      par: 72,
      ratingProvisional: false,
      gender: "M",
    },
    {
      name: "Silver",
      color: "#A8A8A8",
      totalDistance: 5734,
      courseRating: 71.8,
      slopeRating: 133,
      par: 72,
      ratingProvisional: false,
      gender: "M",
    },
    {
      name: "White",
      color: "#FFFFFF",
      totalDistance: 5188,
      courseRating: 69.0,
      slopeRating: 126,
      par: 72,
      ratingProvisional: false,
      gender: "M",
    },
    {
      name: "Green",
      color: "#4CAF50",
      totalDistance: 4575,
      courseRating: 65.5,
      slopeRating: 116,
      par: 69,
      ratingProvisional: false,
      gender: "M",
    },
    // ── Women ──
    {
      name: "Silver",
      color: "#A8A8A8",
      totalDistance: 5734,
      courseRating: 77.7,
      slopeRating: 142,
      par: 72,
      ratingProvisional: false,
      gender: "F",
    },
    {
      name: "White",
      color: "#FFFFFF",
      totalDistance: 5188,
      courseRating: 74.2,
      slopeRating: 136,
      par: 72,
      ratingProvisional: false,
      gender: "F",
    },
    {
      name: "Green",
      color: "#4CAF50",
      totalDistance: 4575,
      courseRating: 70.3,
      slopeRating: 128,
      par: 72,
      ratingProvisional: false,
      gender: "F",
    },
  ],
  holes: [
    { number: 1,  par: 5, strokeIndex: 7,  distances: { Gold: 488, Silver: 466, White: 428, Green: 376 }, elevation: 22 },
    { number: 2,  par: 4, strokeIndex: 9,  distances: { Gold: 349, Silver: 326, White: 282, Green: 256 }, elevation: 23 },
    { number: 3,  par: 3, strokeIndex: 13, distances: { Gold: 164, Silver: 147, White: 133, Green: 113 }, elevation: 17 },
    { number: 4,  par: 4, strokeIndex: 11, distances: { Gold: 343, Silver: 330, White: 286, Green: 263 }, elevation: 13 },
    { number: 5,  par: 4, strokeIndex: 1,  distances: { Gold: 402, Silver: 387, White: 355, Green: 324 }, elevation: 15 },
    { number: 6,  par: 4, strokeIndex: 17, distances: { Gold: 343, Silver: 301, White: 278, Green: 249 }, elevation: 42 },
    { number: 7,  par: 5, strokeIndex: 3,  distances: { Gold: 504, Silver: 457, White: 413, Green: 370 }, elevation: 47 },
    { number: 8,  par: 4, strokeIndex: 5,  distances: { Gold: 386, Silver: 324, White: 309, Green: 275 }, elevation: 62 },
    { number: 9,  par: 3, strokeIndex: 15, distances: { Gold: 135, Silver: 120, White: 105, Green: 88  }, elevation: 16 },
    { number: 10, par: 5, strokeIndex: 6,  distances: { Gold: 567, Silver: 525, White: 469, Green: 419 }, elevation: 42 },
    { number: 11, par: 3, strokeIndex: 10, distances: { Gold: 220, Silver: 195, White: 170, Green: 152 }, elevation: 25 },
    { number: 12, par: 4, strokeIndex: 12, distances: { Gold: 364, Silver: 333, White: 307, Green: 262 }, elevation: 31 },
    { number: 13, par: 3, strokeIndex: 16, distances: { Gold: 178, Silver: 148, White: 129, Green: 111 }, elevation: 30 },
    { number: 14, par: 5, strokeIndex: 8,  distances: { Gold: 445, Silver: 418, White: 369, Green: 337 }, elevation: 27 },
    { number: 15, par: 3, strokeIndex: 18, distances: { Gold: 150, Silver: 130, White: 110, Green: 93  }, elevation: 20 },
    { number: 16, par: 5, strokeIndex: 2,  distances: { Gold: 456, Silver: 440, White: 419, Green: 333 }, elevation: 16 },
    { number: 17, par: 4, strokeIndex: 14, distances: { Gold: 332, Silver: 313, White: 272, Green: 239 }, elevation: 19 },
    { number: 18, par: 4, strokeIndex: 4,  distances: { Gold: 396, Silver: 374, White: 354, Green: 315 }, elevation: 22 },
  ],
};
