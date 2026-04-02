import { describe, it, expect } from "vitest";
import { calcScoreDifferential } from "@/lib/handicap/differential";

describe("calcScoreDifferential", () => {
  it("standard differential: AGS=90, CR=72.0, Slope=125, PCC=0", () => {
    // (113/125) * (90 - 72.0 - 0) = 0.904 * 18 = 16.272 → truncated 16.2
    expect(calcScoreDifferential(90, 72.0, 125, 0)).toBe(16.2);
  });

  it("with PCC adjustment: AGS=90, CR=72.0, Slope=125, PCC=2", () => {
    // (113/125) * (90 - 72.0 - 2) = 0.904 * 16 = 14.464 → truncated 14.4
    expect(calcScoreDifferential(90, 72.0, 125, 2)).toBe(14.4);
  });

  it("scratch golfer: AGS=72, CR=72.0, Slope=125", () => {
    // (113/125) * (72 - 72.0) = 0.0
    expect(calcScoreDifferential(72, 72.0, 125)).toBe(0.0);
  });

  it("high differential: AGS=120, CR=69.0, Slope=126", () => {
    // (113/126) * (120 - 69.0) = 0.896825... * 51 = 45.738... → truncated 45.7
    expect(calcScoreDifferential(120, 69.0, 126)).toBe(45.7);
  });
});
