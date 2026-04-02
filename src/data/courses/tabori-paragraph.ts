import type { CourseData } from "@/lib/handicap/types";

/**
 * Tabori Paragraph Golf Club
 * 9 physical holes played as 18. Par 72.
 * SI verified by Stas; CR/Slope are estimated (provisional).
 */
export const taboriParagraph: CourseData = {
  id: "tabori-paragraph",
  name: "Tabori Paragraph Golf Club",
  location: "Georgia",
  physicalHoles: 9,
  par: 72,
  tees: [
    {
      name: "Black",
      color: "#1A1A1A",
      totalDistance: 5946,
      courseRating: 74.6,
      slopeRating: 133,
      par: 72,
      ratingProvisional: true,
      gender: "M",
    },
    {
      name: "Blue",
      color: "#1E88E5",
      totalDistance: 5496,
      courseRating: 72.8,
      slopeRating: 128,
      par: 72,
      ratingProvisional: true,
      gender: "M",
    },
    {
      name: "White",
      color: "#FFFFFF",
      totalDistance: 5094,
      courseRating: 71.0,
      slopeRating: 123,
      par: 72,
      ratingProvisional: true,
      gender: "M",
    },
    {
      name: "Red",
      color: "#E53935",
      totalDistance: 4532,
      courseRating: 68.8,
      slopeRating: 117,
      par: 72,
      ratingProvisional: true,
      gender: "M",
    },
  ],
  holes: [
    { number: 1,  par: 4, strokeIndex: 11, distances: { Black: 328, Blue: 301, White: 293, Red: 267 } },
    { number: 2,  par: 5, strokeIndex: 9,  distances: { Black: 479, Blue: 445, White: 420, Red: 379 } },
    { number: 3,  par: 3, strokeIndex: 15, distances: { Black: 165, Blue: 146, White: 139, Red: 111 } },
    { number: 4,  par: 4, strokeIndex: 13, distances: { Black: 333, Blue: 305, White: 270, Red: 231 } },
    { number: 5,  par: 4, strokeIndex: 5,  distances: { Black: 318, Blue: 296, White: 268, Red: 216 } },
    { number: 6,  par: 5, strokeIndex: 7,  distances: { Black: 503, Blue: 471, White: 429, Red: 398 } },
    { number: 7,  par: 4, strokeIndex: 1,  distances: { Black: 342, Blue: 319, White: 286, Red: 259 } },
    { number: 8,  par: 3, strokeIndex: 17, distances: { Black: 115, Blue: 94,  White: 90,  Red: 77  } },
    { number: 9,  par: 4, strokeIndex: 3,  distances: { Black: 390, Blue: 371, White: 352, Red: 328 } },
    { number: 10, par: 4, strokeIndex: 12, distances: { Black: 328, Blue: 301, White: 293, Red: 267 } },
    { number: 11, par: 5, strokeIndex: 10, distances: { Black: 479, Blue: 445, White: 420, Red: 379 } },
    { number: 12, par: 3, strokeIndex: 16, distances: { Black: 165, Blue: 146, White: 139, Red: 111 } },
    { number: 13, par: 4, strokeIndex: 14, distances: { Black: 333, Blue: 305, White: 270, Red: 231 } },
    { number: 14, par: 4, strokeIndex: 6,  distances: { Black: 318, Blue: 296, White: 268, Red: 216 } },
    { number: 15, par: 5, strokeIndex: 8,  distances: { Black: 503, Blue: 471, White: 429, Red: 398 } },
    { number: 16, par: 4, strokeIndex: 2,  distances: { Black: 342, Blue: 319, White: 286, Red: 259 } },
    { number: 17, par: 3, strokeIndex: 18, distances: { Black: 115, Blue: 94,  White: 90,  Red: 77  } },
    { number: 18, par: 4, strokeIndex: 4,  distances: { Black: 390, Blue: 371, White: 352, Red: 328 } },
  ],
};
