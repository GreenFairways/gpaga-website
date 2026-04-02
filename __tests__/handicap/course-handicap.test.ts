import { describe, it, expect } from "vitest";
import {
  calcCourseHandicap,
  calcPlayingHandicap,
} from "@/lib/handicap/course-handicap";

describe("calcCourseHandicap", () => {
  it("HI=15.0, Slope=125, CR=72.0, Par=72 → CH=17", () => {
    // CH = round(15.0 * 125/113 + (72.0 - 72)) = round(16.5929...) = 17
    expect(calcCourseHandicap(15.0, 125, 72.0, 72)).toBe(17);
  });

  it("HI=0.0 on neutral course → CH=0", () => {
    expect(calcCourseHandicap(0.0, 113, 72.0, 72)).toBe(0);
  });

  it("accounts for CR-Par difference", () => {
    // HI=10.0, Slope=113, CR=74.0, Par=72 → round(10.0 + 2.0) = 12
    expect(calcCourseHandicap(10.0, 113, 74.0, 72)).toBe(12);
  });
});

describe("calcPlayingHandicap", () => {
  it("95% allowance: CH=17 → PH=16", () => {
    // round(17 * 0.95) = round(16.15) = 16
    expect(calcPlayingHandicap(17, 0.95)).toBe(16);
  });

  it("100% allowance: PH equals CH", () => {
    expect(calcPlayingHandicap(17, 1.0)).toBe(17);
  });

  it("85% allowance: CH=20 → PH=17", () => {
    // round(20 * 0.85) = round(17.0) = 17
    expect(calcPlayingHandicap(20, 0.85)).toBe(17);
  });
});
