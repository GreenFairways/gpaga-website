/**
 * Course display info — descriptions, contacts, facilities, green fees.
 * Separate from CourseData (which is for handicap calculations).
 */

export interface CourseInfo {
  slug: string;
  name: string;
  shortName: string;
  location: string;
  region: string;
  description: string;
  designer: string;
  yearOpened: number;
  holes: number;
  par: number;
  highlight: string;
  featuredLength: string;
  coordinates: { lat: number; lng: number };
  website: string;
  phone: string;
  email: string;
  greenFees: GreenFeeTable | null;
  facilities: string[];
  teeNames: string[];
  /** Default tees by gender for casual games (no divisions) */
  defaultTees: { M: string; F: string };
}

export interface GreenFeeTable {
  currency: string;
  note?: string;
  rows: { label: string; weekday: string; weekend: string }[];
}

export const courseInfos: CourseInfo[] = [
  {
    slug: "tbilisi-hills",
    name: "Tbilisi Hills Golf Club",
    shortName: "Tbilisi Hills",
    location: "Kvemo Teleti",
    region: "Tbilisi",
    description:
      "Georgia's premier 18-hole championship course designed by Lassi Pekka Tilander. Set at the foot of the Caucasus Mountains, the undulating layout at 2,500 feet elevation offers dramatic views and a serious test of golf. A European Tour Destination and consistently ranked among Europe's top continental courses.",
    designer: "Lassi Pekka Tilander",
    yearOpened: 2017,
    holes: 18,
    par: 72,
    highlight: "European Tour Destination",
    featuredLength: "6,223m",
    coordinates: { lat: 41.66, lng: 44.78 },
    website: "https://tbilisihills.com",
    phone: "+995 591 04 04 47",
    email: "golf@tbilisihills.com",
    greenFees: {
      currency: "GEL",
      note: "High season (Apr-Oct). Low season ~50% off. Juniors under 18: 50% off. Residents: 20% off.",
      rows: [
        { label: "9 holes", weekday: "235", weekend: "250" },
        { label: "18 holes", weekday: "350", weekend: "375" },
        { label: "Daily fee", weekday: "470", weekend: "500" },
      ],
    },
    facilities: [
      "Driving range",
      "Putting green",
      "Chipping area",
      "Bunker practice",
      "Clubhouse & restaurant",
      "Pro shop",
      "Golf academy",
      "Buggy rental (90/140 GEL)",
      "Club rental",
    ],
    teeNames: ["Gold", "Silver", "White", "Green"],
    defaultTees: { M: "Silver", F: "Green" },
  },
  {
    slug: "tabori-paragraph",
    name: "Paragraph Golf & Spa Tabori",
    shortName: "Tabori Paragraph",
    location: "Mount Tabori, Tbilisi",
    region: "Tbilisi",
    description:
      "A dramatic 9-hole course designed by Kevin Ramsey of Golfplan, perched on Mount Tabori overlooking Tbilisi. Accessible via a scenic cable car from the city center. Part of the Marriott Autograph Collection resort, the hilltop layout weaves through pine trees with stunning city skyline views. Opened October 2025.",
    designer: "Kevin Ramsey (Golfplan)",
    yearOpened: 2025,
    holes: 9,
    par: 36,
    highlight: "Marriott Autograph Collection",
    featuredLength: "2,973m",
    coordinates: { lat: 41.71, lng: 44.82 },
    website: "https://www.marriott.com",
    phone: "+995 322 009900",
    email: "",
    greenFees: null,
    facilities: [
      "Driving range",
      "Performance center",
      "Luxury hotel & spa",
      "Cable car access",
      "Restaurant",
      "Club rental",
    ],
    teeNames: ["Black", "Blue", "White", "Red"],
    defaultTees: { M: "Blue", F: "Red" },
  },
  {
    slug: "ambassadori-kachreti",
    name: "Ambassadori Kachreti Golf Resort",
    shortName: "Ambassadori Kachreti",
    location: "Kachreti, Gurjaani Municipality",
    region: "Kakheti",
    description:
      "Nestled in Georgia's famous Kakheti wine region, this 9-hole resort course was designed by Graham Cooke and opened in 2014. Part of a 5-star resort with 205 rooms, the course combines golf with Georgian wine country hospitality. Located about 80km east of Tbilisi, it offers a relaxed round in a beautiful natural setting. Season runs March through December.",
    designer: "Graham Cooke",
    yearOpened: 2014,
    holes: 9,
    par: 36,
    highlight: "Wine Country Golf",
    featuredLength: "2,796m",
    coordinates: { lat: 41.62, lng: 45.92 },
    website: "https://ambassadori.com/kachreti",
    phone: "+995 32 243 6999",
    email: "golf@ambassadori.com",
    greenFees: {
      currency: "GEL",
      note: "Contact resort for current rates. Cart rental: 50 GEL.",
      rows: [],
    },
    facilities: [
      "Driving range",
      "Golf school & academy",
      "5-star hotel (205 rooms)",
      "Restaurant",
      "Spa & pools",
      "Cart rental (50 GEL)",
      "Club rental",
      "Tennis & sports",
      "Horseback riding",
    ],
    teeNames: ["White", "Yellow", "Blue", "Red"],
    defaultTees: { M: "White", F: "Red" },
  },
];

export function getCourseInfo(slug: string): CourseInfo | undefined {
  return courseInfos.find((c) => c.slug === slug);
}
