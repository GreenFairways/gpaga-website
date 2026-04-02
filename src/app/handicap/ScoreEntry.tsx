"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { CourseData } from "@/lib/handicap";

interface ScoreEntryProps {
  course: CourseData;
  teeName: string;
  onSubmit: (scores: number[]) => void;
}

export default function ScoreEntry({
  course,
  teeName,
  onSubmit,
}: ScoreEntryProps) {
  const isNineHoleCourse = course.physicalHoles === 9;
  const [nineHoleMode, setNineHoleMode] = useState(false);
  const totalHoles = nineHoleMode ? 9 : 18;
  const [scores, setScores] = useState<(number | null)[]>(
    () => new Array(totalHoles).fill(null),
  );
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset scores when course/tee/mode changes
  useEffect(() => {
    setScores(new Array(totalHoles).fill(null));
  }, [course.id, teeName, totalHoles]);

  const holes = course.holes.slice(0, totalHoles);

  const handleScoreChange = useCallback(
    (index: number, value: string) => {
      const num = value === "" ? null : parseInt(value, 10);
      if (num !== null && (isNaN(num) || num < 0 || num > 20)) return;
      setScores((prev) => {
        const next = [...prev];
        next[index] = num;
        return next;
      });
      // Auto-advance to next input on valid entry
      if (num !== null && num >= 1 && index < totalHoles - 1) {
        setTimeout(() => {
          inputRefs.current[index + 1]?.focus();
          inputRefs.current[index + 1]?.select();
        }, 0);
      }
    },
    [totalHoles],
  );

  const frontNine = scores.slice(0, Math.min(9, totalHoles));
  const backNine = totalHoles > 9 ? scores.slice(9, 18) : [];

  const frontPar = holes
    .slice(0, Math.min(9, totalHoles))
    .reduce((s, h) => s + h.par, 0);
  const backPar =
    totalHoles > 9
      ? holes.slice(9, 18).reduce((s, h) => s + h.par, 0)
      : 0;

  const frontScore = frontNine.reduce(
    (s: number, v) => s + (v ?? 0),
    0,
  );
  const backScore = backNine.reduce(
    (s: number, v) => s + (v ?? 0),
    0,
  );
  const totalScore = frontScore + backScore;
  const totalPar = frontPar + backPar;

  const allFilled = scores.every((s) => s !== null && s >= 1);

  function handleSubmit() {
    if (!allFilled) return;
    onSubmit(scores as number[]);
  }

  // Get distance for the tee from hole data
  function getDistance(hole: (typeof holes)[0]): number | null {
    return hole.distances[teeName] ?? null;
  }

  return (
    <div className="space-y-4">
      {/* Nine-hole toggle for 9-hole courses */}
      {isNineHoleCourse && (
        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={nineHoleMode}
              onChange={(e) => setNineHoleMode(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary accent-primary"
            />
            Enter 9 holes only
          </label>
          {nineHoleMode && (
            <span className="text-xs text-text-muted">
              9-hole differential will be paired later
            </span>
          )}
        </div>
      )}

      {/* Score table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface text-text-muted">
              <th className="sticky left-0 z-10 bg-surface px-3 py-2.5 text-left font-semibold">
                Hole
              </th>
              <th className="px-3 py-2.5 text-center font-semibold">Par</th>
              <th className="px-3 py-2.5 text-center font-semibold">SI</th>
              <th className="hidden px-3 py-2.5 text-center font-semibold sm:table-cell">
                Dist
              </th>
              <th className="px-3 py-2.5 text-center font-semibold">Score</th>
            </tr>
          </thead>
          <tbody>
            {holes.map((hole, i) => {
              const dist = getDistance(hole);
              const score = scores[i];
              const overPar =
                score !== null && score > hole.par
                  ? score - hole.par
                  : 0;
              const underPar =
                score !== null && score < hole.par
                  ? hole.par - score
                  : 0;

              return (
                <tr
                  key={hole.number}
                  className={`border-b border-border/50 ${
                    i === 8 && totalHoles > 9
                      ? "border-b-2 border-b-border"
                      : ""
                  }`}
                >
                  <td className="sticky left-0 z-10 bg-surface-elevated px-3 py-1.5 font-semibold text-text-secondary">
                    {hole.number}
                  </td>
                  <td className="px-3 py-1.5 text-center text-text-muted">
                    {hole.par}
                  </td>
                  <td className="px-3 py-1.5 text-center text-text-muted">
                    {hole.strokeIndex}
                  </td>
                  <td className="hidden px-3 py-1.5 text-center text-text-muted sm:table-cell">
                    {dist !== null ? `${dist}m` : "-"}
                  </td>
                  <td className="px-2 py-1">
                    <div className="flex items-center justify-center gap-1.5">
                      <input
                        ref={(el) => {
                          inputRefs.current[i] = el;
                        }}
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={20}
                        value={score ?? ""}
                        onChange={(e) => handleScoreChange(i, e.target.value)}
                        onFocus={(e) => e.target.select()}
                        className={`w-14 rounded-md border px-2 py-1.5 text-center text-sm font-medium transition-colors
                          ${
                            score === null
                              ? "border-border bg-surface-elevated text-text-primary"
                              : overPar > 0
                                ? "border-red-300 bg-red-50 text-red-700"
                                : underPar > 0
                                  ? "border-green-300 bg-green-50 text-green-700"
                                  : "border-primary/30 bg-accent text-secondary"
                          }
                          focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30`}
                        aria-label={`Score for hole ${hole.number}`}
                      />
                      {score !== null && overPar > 0 && (
                        <span className="text-xs font-medium text-red-500">
                          +{overPar}
                        </span>
                      )}
                      {score !== null && underPar > 0 && (
                        <span className="text-xs font-medium text-green-600">
                          -{underPar}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            {/* OUT subtotal (only when 18 holes) */}
            {totalHoles > 9 && (
              <tr className="border-b border-border bg-surface/60 font-semibold text-text-secondary">
                <td className="sticky left-0 z-10 bg-surface/60 px-3 py-2">
                  OUT
                </td>
                <td className="px-3 py-2 text-center">{frontPar}</td>
                <td className="px-3 py-2" />
                <td className="hidden px-3 py-2 sm:table-cell" />
                <td className="px-3 py-2 text-center">{frontScore || "-"}</td>
              </tr>
            )}
            {/* IN subtotal (only when 18 holes) */}
            {totalHoles > 9 && (
              <tr className="border-b border-border bg-surface/60 font-semibold text-text-secondary">
                <td className="sticky left-0 z-10 bg-surface/60 px-3 py-2">
                  IN
                </td>
                <td className="px-3 py-2 text-center">{backPar}</td>
                <td className="px-3 py-2" />
                <td className="hidden px-3 py-2 sm:table-cell" />
                <td className="px-3 py-2 text-center">{backScore || "-"}</td>
              </tr>
            )}
            {/* TOTAL */}
            <tr className="bg-secondary/5 font-bold text-secondary">
              <td className="sticky left-0 z-10 bg-secondary/5 px-3 py-2.5">
                TOTAL
              </td>
              <td className="px-3 py-2.5 text-center">{totalPar}</td>
              <td className="px-3 py-2.5" />
              <td className="hidden px-3 py-2.5 sm:table-cell" />
              <td className="px-3 py-2.5 text-center">
                {allFilled ? totalScore : "-"}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!allFilled}
        className="w-full rounded-lg bg-primary px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
      >
        Calculate
      </button>
    </div>
  );
}
