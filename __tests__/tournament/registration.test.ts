import { describe, it, expect } from "vitest";
import {
  generateAccessCode,
  calcRegistrationHandicap,
} from "../../src/lib/tournament/registration";

describe("generateAccessCode", () => {
  it("generates a 6-character code", () => {
    const code = generateAccessCode();
    expect(code).toHaveLength(6);
  });

  it("only uses readable characters (no I, O, 0, 1)", () => {
    for (let i = 0; i < 100; i++) {
      const code = generateAccessCode();
      expect(code).not.toMatch(/[IO01]/);
    }
  });

  it("generates unique codes", () => {
    const codes = new Set<string>();
    for (let i = 0; i < 100; i++) {
      codes.add(generateAccessCode());
    }
    // With 32^6 = ~1 billion combinations, 100 codes should be unique
    expect(codes.size).toBe(100);
  });
});

describe("calcRegistrationHandicap", () => {
  it("returns null for null handicap", () => {
    const result = calcRegistrationHandicap(
      null,
      "tbilisi-hills",
      "Silver",
      "M",
      0.95,
    );
    expect(result.courseHandicap).toBeNull();
    expect(result.playingHandicap).toBeNull();
  });

  it("calculates handicap for Tbilisi Hills Silver tees", () => {
    // Silver Men: CR 71.8, SR 133
    const result = calcRegistrationHandicap(
      15.0,
      "tbilisi-hills",
      "Silver",
      "M",
      0.95,
    );
    // Course HCP = 15 * (133/113) + (71.8 - 72) = 17.65 - 0.2 = 17.45 => 17
    expect(result.courseHandicap).not.toBeNull();
    expect(typeof result.courseHandicap).toBe("number");
    // Playing HCP = round(17 * 0.95) = 16
    expect(result.playingHandicap).not.toBeNull();
  });

  it("returns null for unknown course", () => {
    const result = calcRegistrationHandicap(
      15.0,
      "nonexistent",
      "Silver",
      "M",
      0.95,
    );
    expect(result.courseHandicap).toBeNull();
  });

  it("returns null for unknown tee", () => {
    const result = calcRegistrationHandicap(
      15.0,
      "tbilisi-hills",
      "Platinum",
      "M",
      0.95,
    );
    expect(result.courseHandicap).toBeNull();
  });
});
