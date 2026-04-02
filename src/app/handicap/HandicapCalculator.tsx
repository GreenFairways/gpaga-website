"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import FadeIn from "@/components/FadeIn";
import CourseSelector from "./CourseSelector";
import ScoreEntry from "./ScoreEntry";
import ResultCard from "./ResultCard";
import RoundHistory from "./RoundHistory";
import { getCourse } from "@/data/courses";
import { LocalHandicapStorage } from "@/lib/storage";
import {
  adjustScores,
  calcScoreDifferential,
  calcHandicapIndex,
  calcCourseHandicap,
  calcPlayingHandicap,
} from "@/lib/handicap";
import type { CourseData, TeeData, RoundScore } from "@/lib/handicap";

interface CalculationResult {
  adjustedScores: number[];
  adjustedGross: number;
  scoreDifferential: number;
  ndbAdjustments: number;
  courseRating: number;
  slopeRating: number;
  par: number;
  isProvisional: boolean;
}

const storage = new LocalHandicapStorage();

export default function HandicapCalculator() {
  // --- Selection state ---
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedTeeName, setSelectedTeeName] = useState<string | null>(null);
  const [selectedGender, setSelectedGender] = useState<"M" | "F">("M");

  // --- Rounds and results ---
  const [rounds, setRounds] = useState<RoundScore[]>([]);
  const [lastResult, setLastResult] = useState<CalculationResult | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Load rounds from localStorage on mount
  useEffect(() => {
    setRounds(storage.getRounds());
  }, []);

  // Derived data
  const selectedCourse: CourseData | null = selectedCourseId
    ? getCourse(selectedCourseId) ?? null
    : null;

  const selectedTee: TeeData | null = useMemo(() => {
    if (!selectedCourse || !selectedTeeName) return null;
    return (
      selectedCourse.tees.find(
        (t) =>
          t.name === selectedTeeName &&
          (t.gender === selectedGender || t.gender === "Mixed"),
      ) ?? null
    );
  }, [selectedCourse, selectedTeeName, selectedGender]);

  // Handicap index from all rounds
  const handicapResult = useMemo(() => {
    const diffs = rounds.map((r) => r.scoreDifferential);
    return calcHandicapIndex(diffs);
  }, [rounds]);

  const handicapIndex = handicapResult?.index ?? null;

  // Course handicap for currently selected tee
  const courseHandicap = useMemo(() => {
    if (handicapIndex === null || !selectedTee) return null;
    return calcCourseHandicap(
      handicapIndex,
      selectedTee.slopeRating,
      selectedTee.courseRating,
      selectedTee.par,
    );
  }, [handicapIndex, selectedTee]);

  const playingHandicap = useMemo(() => {
    if (courseHandicap === null) return null;
    return calcPlayingHandicap(courseHandicap, 0.95);
  }, [courseHandicap]);

  // --- Handlers ---
  const handleCourseSelect = useCallback(
    (courseId: string, teeName: string, gender: "M" | "F") => {
      setSelectedCourseId(courseId);
      setSelectedTeeName(teeName);
      setSelectedGender(gender);
      setLastResult(null);
    },
    [],
  );

  const handleScoreSubmit = useCallback(
    (rawScores: number[]) => {
      if (!selectedCourse || !selectedTee) return;

      // Calculate course handicap for NDB adjustment (use 0 if no handicap yet)
      const chForAdj =
        handicapIndex !== null
          ? calcCourseHandicap(
              handicapIndex,
              selectedTee.slopeRating,
              selectedTee.courseRating,
              selectedTee.par,
            )
          : 0;

      // Adjust scores (Net Double Bogey)
      const { adjustedScores: adjScores, adjustedGross } = adjustScores(
        rawScores,
        selectedCourse.holes.slice(0, rawScores.length),
        chForAdj,
      );

      // Count NDB adjustments
      const ndbCount = rawScores.filter(
        (raw, i) => adjScores[i] < raw,
      ).length;

      // Score differential
      const differential = calcScoreDifferential(
        adjustedGross,
        selectedTee.courseRating,
        selectedTee.slopeRating,
        0, // PCC = 0 for local calculation
      );

      // Build result
      const result: CalculationResult = {
        adjustedScores: adjScores,
        adjustedGross,
        scoreDifferential: differential,
        ndbAdjustments: ndbCount,
        courseRating: selectedTee.courseRating,
        slopeRating: selectedTee.slopeRating,
        par: selectedTee.par,
        isProvisional: selectedTee.ratingProvisional,
      };
      setLastResult(result);

      // Build and save round
      const round: RoundScore = {
        id: crypto.randomUUID(),
        date: new Date().toISOString().split("T")[0],
        courseId: selectedCourse.id,
        teeName: selectedTee.name,
        gender: selectedGender,
        holeScores: rawScores,
        adjustedScores: adjScores,
        adjustedGross,
        scoreDifferential: differential,
        pcc: 0,
        isNineHole: rawScores.length === 9,
      };

      storage.addRound(round);
      setRounds(storage.getRounds());
    },
    [selectedCourse, selectedTee, selectedGender, handicapIndex],
  );

  const handleDeleteRound = useCallback((id: string) => {
    storage.deleteRound(id);
    setRounds(storage.getRounds());
  }, []);

  const handleExport = useCallback(() => {
    const json = storage.exportData();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gpaga-handicap-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleImport = useCallback((json: string) => {
    storage.importData(json);
    setRounds(storage.getRounds());
  }, []);

  const handleClear = useCallback(() => {
    storage.clear();
    setRounds([]);
    setLastResult(null);
  }, []);

  return (
    <section className="mx-auto max-w-3xl px-6 py-12 lg:px-8">
      {/* Page header */}
      <FadeIn direction="up">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-secondary sm:text-4xl">
            Handicap Calculator
          </h1>
          <p className="mt-2 text-base text-text-secondary">
            Calculate your World Handicap System index on Georgian courses.
            Scores are saved locally on your device.
          </p>
          {handicapIndex !== null && (
            <div className="mt-4 inline-flex items-baseline gap-2 rounded-lg bg-accent px-4 py-2">
              <span className="text-sm font-medium text-text-muted">
                Current Index
              </span>
              <span className="text-2xl font-bold tabular-nums text-primary">
                {handicapIndex.toFixed(1)}
              </span>
            </div>
          )}
        </div>
      </FadeIn>

      {/* Step 1: Course + Tee selection */}
      <FadeIn direction="up" delay={0.05}>
        <div className="mb-8 rounded-lg border border-border bg-surface-elevated p-5">
          <h2 className="mb-4 text-lg font-semibold text-secondary">
            1. Choose Course &amp; Tee
          </h2>
          <CourseSelector onSelect={handleCourseSelect} />
        </div>
      </FadeIn>

      {/* Step 2: Score entry (shown after course/tee selected) */}
      {selectedCourse && selectedTee && (
        <FadeIn direction="up">
          <div className="mb-8 rounded-lg border border-border bg-surface-elevated p-5">
            <h2 className="mb-1 text-lg font-semibold text-secondary">
              2. Enter Scores
            </h2>
            <p className="mb-4 text-xs text-text-muted">
              {selectedCourse.name} &middot; {selectedTee.name} Tee &middot; Par{" "}
              {selectedTee.par}
              {selectedTee.ratingProvisional && (
                <span className="ml-2 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[0.65rem] font-medium text-amber-800">
                  Provisional ratings
                </span>
              )}
            </p>
            <ScoreEntry
              course={selectedCourse}
              teeName={selectedTee.name}
              onSubmit={handleScoreSubmit}
            />
          </div>
        </FadeIn>
      )}

      {/* Step 3: Result card */}
      {lastResult && (
        <div className="mb-8">
          <ResultCard
            scoreDifferential={lastResult.scoreDifferential}
            adjustedGross={lastResult.adjustedGross}
            courseRating={lastResult.courseRating}
            slopeRating={lastResult.slopeRating}
            par={lastResult.par}
            isProvisional={lastResult.isProvisional}
            ndbAdjustments={lastResult.ndbAdjustments}
            handicapIndex={handicapIndex}
            courseHandicap={courseHandicap}
            playingHandicap={playingHandicap}
          />
        </div>
      )}

      {/* Round history toggle */}
      <FadeIn direction="up" delay={0.1}>
        <div className="rounded-lg border border-border bg-surface-elevated p-5">
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="flex w-full items-center justify-between text-left"
            aria-expanded={showHistory}
          >
            <h2 className="text-lg font-semibold text-secondary">
              Round History
              {rounds.length > 0 && (
                <span className="ml-2 text-sm font-normal text-text-muted">
                  ({rounds.length} round{rounds.length !== 1 ? "s" : ""})
                </span>
              )}
            </h2>
            <svg
              className={`h-5 w-5 text-text-muted transition-transform ${
                showHistory ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
              />
            </svg>
          </button>
          {showHistory && (
            <div className="mt-4">
              <RoundHistory
                rounds={rounds}
                onDelete={handleDeleteRound}
                onExport={handleExport}
                onImport={handleImport}
                onClear={handleClear}
              />
            </div>
          )}
        </div>
      </FadeIn>
    </section>
  );
}
