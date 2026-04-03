import type { CourseData } from "@/lib/handicap/types";

/**
 * Ambassadori Kachreti Golf Resort
 * 9 holes, Par 36. Designed by Graham Cooke (2014).
 * Located in Kakheti wine region, ~80km from Tbilisi.
 *
 * CR/Slope are provisional estimates — no official WHS rating available yet.
 * Hole-by-hole distances estimated from total yardage and typical par distribution.
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
      totalDistance: 5592, // 2796 × 2
      courseRating: 70.2,
      slopeRating: 125,
      par: 72,
      ratingProvisional: true,
      gender: "M",
    },
    {
      name: "Yellow",
      color: "#F9A825",
      totalDistance: 5156, // 2578 × 2
      courseRating: 68.4,
      slopeRating: 120,
      par: 72,
      ratingProvisional: true,
      gender: "M",
    },
    {
      name: "Blue",
      color: "#1E88E5",
      totalDistance: 4588, // 2294 × 2
      courseRating: 66.0,
      slopeRating: 115,
      par: 72,
      ratingProvisional: true,
      gender: "M",
    },
    {
      name: "Red",
      color: "#E53935",
      totalDistance: 4176, // 2088 × 2
      courseRating: 68.0,
      slopeRating: 118,
      par: 72,
      ratingProvisional: true,
      gender: "F",
    },
  ],
  holes: [
    // Front 9
    { number: 1,  par: 4, strokeIndex: 7,  distances: { White: 340, Yellow: 310, Blue: 270, Red: 240 } },
    { number: 2,  par: 5, strokeIndex: 3,  distances: { White: 460, Yellow: 430, Blue: 380, Red: 345 } },
    { number: 3,  par: 3, strokeIndex: 15, distances: { White: 155, Yellow: 140, Blue: 125, Red: 110 } },
    { number: 4,  par: 4, strokeIndex: 1,  distances: { White: 380, Yellow: 350, Blue: 310, Red: 280 } },
    { number: 5,  par: 4, strokeIndex: 11, distances: { White: 310, Yellow: 285, Blue: 255, Red: 230 } },
    { number: 6,  par: 3, strokeIndex: 17, distances: { White: 145, Yellow: 130, Blue: 115, Red: 100 } },
    { number: 7,  par: 5, strokeIndex: 5,  distances: { White: 470, Yellow: 440, Blue: 390, Red: 355 } },
    { number: 8,  par: 4, strokeIndex: 9,  distances: { White: 330, Yellow: 305, Blue: 270, Red: 245 } },
    { number: 9,  par: 4, strokeIndex: 13, distances: { White: 206, Yellow: 188, Blue: 179, Red: 183 } },
    // Back 9 (same physical holes, different SI)
    { number: 10, par: 4, strokeIndex: 8,  distances: { White: 340, Yellow: 310, Blue: 270, Red: 240 } },
    { number: 11, par: 5, strokeIndex: 4,  distances: { White: 460, Yellow: 430, Blue: 380, Red: 345 } },
    { number: 12, par: 3, strokeIndex: 16, distances: { White: 155, Yellow: 140, Blue: 125, Red: 110 } },
    { number: 13, par: 4, strokeIndex: 2,  distances: { White: 380, Yellow: 350, Blue: 310, Red: 280 } },
    { number: 14, par: 4, strokeIndex: 12, distances: { White: 310, Yellow: 285, Blue: 255, Red: 230 } },
    { number: 15, par: 3, strokeIndex: 18, distances: { White: 145, Yellow: 130, Blue: 115, Red: 100 } },
    { number: 16, par: 5, strokeIndex: 6,  distances: { White: 470, Yellow: 440, Blue: 390, Red: 355 } },
    { number: 17, par: 4, strokeIndex: 10, distances: { White: 330, Yellow: 305, Blue: 270, Red: 245 } },
    { number: 18, par: 4, strokeIndex: 14, distances: { White: 206, Yellow: 188, Blue: 179, Red: 183 } },
  ],
};
