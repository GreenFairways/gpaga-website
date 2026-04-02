import { describe, it, expect } from "vitest";
import { applySafeguards } from "@/lib/handicap/safeguards";

describe("applySafeguards", () => {
  it("no low index (new player) → no caps applied", () => {
    const result = applySafeguards(20.0, null);
    expect(result.finalIndex).toBe(20.0);
    expect(result.softCapApplied).toBe(false);
    expect(result.hardCapApplied).toBe(false);
  });

  it("rise within +3.0 of low index → no cap", () => {
    // lowIndex=10.0, calculated=12.0 → rise=2.0, under soft cap threshold
    const result = applySafeguards(12.0, 10.0);
    expect(result.finalIndex).toBe(12.0);
    expect(result.softCapApplied).toBe(false);
    expect(result.hardCapApplied).toBe(false);
  });

  it("rise of +4.0 → soft cap applied", () => {
    // lowIndex=10.0, calculated=14.0 → rise=4.0
    // softLimit=13.0, excess=1.0, reduced by 50% → 13.0 + 0.5 = 13.5
    const result = applySafeguards(14.0, 10.0);
    expect(result.finalIndex).toBe(13.5);
    expect(result.softCapApplied).toBe(true);
    expect(result.hardCapApplied).toBe(false);
  });

  it("rise of +6.0 → hard cap applied", () => {
    // lowIndex=10.0, calculated=16.0 → rise=6.0
    // softLimit=13.0, excess=3.0, reduced by 50% → 13.0 + 1.5 = 14.5
    // But hardLimit=15.0, so 14.5 < 15.0 → actually only soft cap
    // Need a bigger rise to trigger hard cap:
    // lowIndex=10.0, calculated=20.0 → softLimit=13.0, excess=7.0 → 13.0+3.5=16.5 > 15.0 → hard cap at 15.0
    const result = applySafeguards(20.0, 10.0);
    expect(result.finalIndex).toBe(15.0);
    expect(result.softCapApplied).toBe(true);
    expect(result.hardCapApplied).toBe(true);
  });

  it("rise of exactly +6.0 triggers soft cap only (soft-capped value < hard limit)", () => {
    // lowIndex=10.0, calculated=16.0
    // softLimit=13.0, excess=3.0, reduced by 50% → 13.0+1.5 = 14.5
    // hardLimit=15.0 → 14.5 < 15.0 → no hard cap
    const result = applySafeguards(16.0, 10.0);
    expect(result.finalIndex).toBe(14.5);
    expect(result.softCapApplied).toBe(true);
    expect(result.hardCapApplied).toBe(false);
  });

  it("absolute maximum at 54.0", () => {
    const result = applySafeguards(60.0, null);
    expect(result.finalIndex).toBe(54.0);
  });
});
