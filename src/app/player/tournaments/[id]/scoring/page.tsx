"use client";

import { useState, useEffect, useCallback, use, useRef } from "react";
import Link from "next/link";

interface Registration {
  id: string;
  playerId: string;
  firstName: string;
  lastName: string;
  handicapIndexAtReg: number | null;
  playingHandicap: number | null;
  teeName: string | null;
  status: string;
}

interface Score {
  registrationId: string;
  holeNumber: number;
  rawScore: number;
  stablefordPoints: number | null;
}

interface Tournament {
  id: string;
  name: string;
  courseId: string;
  format: string;
  status: string;
}

interface CourseHole {
  number: number;
  par: number;
  strokeIndex: number;
  distances: Record<string, number>;
}

const SCORE_COLORS: Record<string, string> = {
  eagle: "bg-amber-400 text-amber-900",
  birdie: "bg-green-500 text-white",
  par: "bg-white text-secondary border border-border",
  bogey: "bg-red-400 text-white",
  double: "bg-red-600 text-white",
  worse: "bg-red-800 text-white",
};

function getScoreLabel(score: number, par: number): string {
  const diff = score - par;
  if (diff <= -2) return "eagle";
  if (diff === -1) return "birdie";
  if (diff === 0) return "par";
  if (diff === 1) return "bogey";
  if (diff === 2) return "double";
  return "worse";
}

function getScoreName(score: number, par: number): string {
  const diff = score - par;
  if (diff <= -3) return "Albatross";
  if (diff === -2) return "Eagle";
  if (diff === -1) return "Birdie";
  if (diff === 0) return "Par";
  if (diff === 1) return "Bogey";
  if (diff === 2) return "Double";
  if (diff === 3) return "Triple";
  return `+${diff}`;
}

export default function PlayerScoringPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [holes, setHoles] = useState<CourseHole[]>([]);
  const [currentHole, setCurrentHole] = useState(1);
  const [saving, setSaving] = useState<string | null>(null); // regId being saved
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const touchStartX = useRef<number | null>(null);

  const load = useCallback(async () => {
    const [meRes, tRes, rRes, sRes] = await Promise.all([
      fetch("/api/auth/me"),
      fetch(`/api/tournaments/${id}`),
      fetch(`/api/tournaments/${id}/registrations`),
      fetch(`/api/tournaments/${id}/scores`),
    ]);

    if (meRes.ok) {
      const me = await meRes.json();
      setMyPlayerId(me.id);
    }

    if (tRes.ok) {
      const t = await tRes.json();
      setTournament(t);
      try {
        const { courses } = await import("@/data/courses");
        const course = courses[t.courseId];
        if (course) {
          setHoles(
            course.holes.map((h: CourseHole) => ({
              number: h.number,
              par: h.par,
              strokeIndex: h.strokeIndex,
              distances: h.distances,
            })),
          );
        }
      } catch {
        // fallback
      }
    }
    if (rRes.ok) {
      const regs: Registration[] = await rRes.json();
      setRegistrations(regs.filter((r) => r.status !== "withdrawn"));
    }
    if (sRes.ok) setScores(await sRes.json());
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Swipe handling
  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 60) {
      if (diff < 0 && currentHole < holes.length) {
        setCurrentHole(currentHole + 1);
      } else if (diff > 0 && currentHole > 1) {
        setCurrentHole(currentHole - 1);
      }
    }
    touchStartX.current = null;
  }

  function getPlayerScore(regId: string, hole: number): number | null {
    const s = scores.find(
      (s) => s.registrationId === regId && s.holeNumber === hole,
    );
    return s ? s.rawScore : null;
  }

  function getPlayerTotal(regId: string): { strokes: number; holes: number; toPar: number } {
    let strokes = 0;
    let holesPlayed = 0;
    let parTotal = 0;
    for (const h of holes) {
      const s = scores.find(
        (sc) => sc.registrationId === regId && sc.holeNumber === h.number,
      );
      if (s) {
        strokes += s.rawScore;
        holesPlayed++;
        parTotal += h.par;
      }
    }
    return { strokes, holes: holesPlayed, toPar: strokes - parTotal };
  }

  async function saveScore(regId: string, holeNumber: number, rawScore: number) {
    setSaving(regId);
    try {
      const res = await fetch(`/api/tournaments/${id}/scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId: regId, holeNumber, rawScore }),
      });
      if (res.ok) {
        const saved = await res.json();
        setScores((prev) => {
          const filtered = prev.filter(
            (s) => !(s.registrationId === regId && s.holeNumber === holeNumber),
          );
          return [...filtered, saved];
        });
      }
    } finally {
      setSaving(null);
    }
  }

  function adjustScore(regId: string, holeNumber: number, par: number, delta: number) {
    const current = getPlayerScore(regId, holeNumber);
    const newScore = current !== null ? current + delta : par + delta;
    if (newScore < 1 || newScore > 20) return;
    saveScore(regId, holeNumber, newScore);
  }

  if (!tournament || holes.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface">
        <p className="text-text-muted">Loading scorecard...</p>
      </main>
    );
  }

  const hole = holes.find((h) => h.number === currentHole);
  if (!hole) return null;

  // Sort: current player first, then others
  const sortedRegs = [...registrations].sort((a, b) => {
    if (a.playerId === myPlayerId) return -1;
    if (b.playerId === myPlayerId) return 1;
    return 0;
  });

  const totalPar = holes.reduce((s, h) => s + h.par, 0);

  return (
    <main
      className="min-h-screen bg-surface select-none"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Top bar */}
      <div className="sticky top-0 z-20 border-b border-border bg-surface-elevated px-4 py-2">
        <div className="flex items-center justify-between">
          <Link
            href={`/player/tournaments/${id}`}
            className="text-sm text-text-muted"
          >
            &larr; Back
          </Link>
          <span className="text-xs font-medium text-text-muted">
            {tournament.name}
          </span>
          <span className="text-xs text-text-muted">
            Par {totalPar}
          </span>
        </div>
      </div>

      {/* Hole navigation strip */}
      <div className="sticky top-[41px] z-10 overflow-x-auto border-b border-border bg-surface-elevated">
        <div className="flex">
          {holes.map((h) => {
            const allEntered = registrations.every(
              (r) => getPlayerScore(r.id, h.number) !== null,
            );
            return (
              <button
                key={h.number}
                onClick={() => setCurrentHole(h.number)}
                className={`flex-shrink-0 px-3 py-2 text-center text-xs transition-colors ${
                  h.number === currentHole
                    ? "border-b-2 border-primary bg-primary/5 font-bold text-primary"
                    : allEntered
                      ? "text-green-600"
                      : "text-text-muted"
                }`}
              >
                {h.number}
              </button>
            );
          })}
        </div>
      </div>

      {/* Current hole info */}
      <div className="px-4 py-4 text-center">
        <div className="text-4xl font-bold text-secondary">Hole {hole.number}</div>
        <div className="mt-1 flex items-center justify-center gap-4 text-sm text-text-muted">
          <span className="rounded-full bg-accent px-3 py-0.5 font-semibold">
            Par {hole.par}
          </span>
          <span>SI {hole.strokeIndex}</span>
          {hole.distances && Object.keys(hole.distances).length > 0 && (
            <span>
              {Object.values(hole.distances)[0]}m
            </span>
          )}
        </div>

        {/* Distance per tee */}
        {Object.keys(hole.distances).length > 1 && (
          <div className="mt-2 flex justify-center gap-3 text-xs text-text-muted">
            {Object.entries(hole.distances).map(([tee, dist]) => (
              <span key={tee}>
                {tee}: {dist}m
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Player score cards */}
      <div className="space-y-3 px-4 pb-24">
        {sortedRegs.map((reg) => {
          const score = getPlayerScore(reg.id, hole.number);
          const total = getPlayerTotal(reg.id);
          const isMe = reg.playerId === myPlayerId;
          const isSaving = saving === reg.id;
          const scoreLabel = score !== null ? getScoreLabel(score, hole.par) : null;
          const scoreName = score !== null ? getScoreName(score, hole.par) : null;
          const scoreColor = scoreLabel ? SCORE_COLORS[scoreLabel] : "";

          return (
            <div
              key={reg.id}
              className={`rounded-2xl border bg-surface-elevated p-4 ${
                isMe ? "border-primary/30" : "border-border"
              }`}
            >
              {/* Player header */}
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <span className={`text-sm font-semibold ${isMe ? "text-primary" : "text-secondary"}`}>
                    {reg.firstName} {reg.lastName}
                  </span>
                  {isMe && (
                    <span className="ml-2 text-[10px] font-medium uppercase text-primary/60">
                      You
                    </span>
                  )}
                </div>
                <div className="text-right text-xs text-text-muted">
                  <span>HI {reg.handicapIndexAtReg?.toFixed(1) ?? "-"}</span>
                  <span className="ml-2">PH {reg.playingHandicap ?? "-"}</span>
                  {total.holes > 0 && (
                    <span className="ml-2 font-semibold text-secondary">
                      {total.toPar === 0 ? "E" : total.toPar > 0 ? `+${total.toPar}` : total.toPar}
                      <span className="font-normal text-text-muted"> ({total.strokes})</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Score entry: - [score] + */}
              <div className="flex items-center justify-center gap-4">
                {/* Minus button */}
                <button
                  onClick={() => adjustScore(reg.id, hole.number, hole.par, -1)}
                  disabled={isSaving}
                  className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-border bg-surface text-2xl font-bold text-text-secondary active:bg-accent active:scale-95 transition-transform disabled:opacity-50"
                >
                  -
                </button>

                {/* Score display */}
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-20 w-20 items-center justify-center rounded-full text-3xl font-bold transition-all ${
                      score !== null
                        ? scoreColor
                        : "border-2 border-dashed border-border text-text-muted"
                    } ${isSaving ? "animate-pulse" : ""}`}
                  >
                    {score !== null ? score : hole.par}
                  </div>
                  {score !== null && scoreName && (
                    <span className="mt-1 text-xs font-medium text-text-muted">
                      {scoreName}
                    </span>
                  )}
                </div>

                {/* Plus button */}
                <button
                  onClick={() => adjustScore(reg.id, hole.number, hole.par, +1)}
                  disabled={isSaving}
                  className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-border bg-surface text-2xl font-bold text-text-secondary active:bg-accent active:scale-95 transition-transform disabled:opacity-50"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-surface-elevated px-4 py-3 safe-area-bottom">
        <div className="flex items-center justify-between">
          <button
            onClick={() => currentHole > 1 && setCurrentHole(currentHole - 1)}
            disabled={currentHole === 1}
            className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-secondary disabled:opacity-30"
          >
            &larr; Hole {currentHole - 1 || ""}
          </button>

          <div className="text-center">
            <div className="text-lg font-bold text-secondary">
              {currentHole} / {holes.length}
            </div>
          </div>

          <button
            onClick={() =>
              currentHole < holes.length && setCurrentHole(currentHole + 1)
            }
            disabled={currentHole === holes.length}
            className={`rounded-xl px-5 py-3 text-sm font-semibold ${
              currentHole === holes.length
                ? "bg-green-600 text-white"
                : "bg-primary text-white"
            } disabled:opacity-30`}
          >
            {currentHole === holes.length
              ? "Finish"
              : `Hole ${currentHole + 1} \u2192`}
          </button>
        </div>
      </div>
    </main>
  );
}
