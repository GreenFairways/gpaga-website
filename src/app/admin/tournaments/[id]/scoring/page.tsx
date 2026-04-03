"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import Link from "next/link";
import { use } from "react";

interface Registration {
  id: string;
  firstName: string;
  lastName: string;
  playingHandicap: number | null;
  groupNumber: number | null;
  teeTime: string | null;
}

interface Score {
  registrationId: string;
  holeNumber: number;
  rawScore: number;
}

interface Tournament {
  id: string;
  name: string;
  courseId: string;
}

interface CourseHole {
  number: number;
  par: number;
}

export default function ScoringPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [holes, setHoles] = useState<CourseHole[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Local score edits keyed by `${regId}-${hole}`
  const [edits, setEdits] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const [tRes, rRes, sRes] = await Promise.all([
      fetch(`/api/tournaments/${id}`),
      fetch(`/api/tournaments/${id}/registrations`),
      fetch(`/api/tournaments/${id}/scores`),
    ]);
    if (tRes.ok) {
      const t = await tRes.json();
      setTournament(t);
      // Load course holes
      try {
        const { courses } = await import("@/data/courses");
        const course = courses[t.courseId];
        if (course) {
          setHoles(
            course.holes.map((h: { number: number; par: number }) => ({
              number: h.number,
              par: h.par,
            })),
          );
        }
      } catch {
        // Static import fallback
      }
    }
    if (rRes.ok) setRegistrations(await rRes.json());
    if (sRes.ok) setScores(await sRes.json());
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Group registrations by group number
  const groups = new Map<number, Registration[]>();
  for (const r of registrations) {
    const g = r.groupNumber ?? 0;
    const arr = groups.get(g) || [];
    arr.push(r);
    groups.set(g, arr);
  }
  const sortedGroups = [...groups.entries()].sort(([a], [b]) => a - b);

  const currentGroupRegs = selectedGroup != null
    ? groups.get(selectedGroup) || []
    : [];

  function getScore(regId: string, hole: number): string {
    const key = `${regId}-${hole}`;
    if (edits[key] !== undefined) return edits[key];
    const s = scores.find(
      (s) => s.registrationId === regId && s.holeNumber === hole,
    );
    return s ? s.rawScore.toString() : "";
  }

  function setEdit(regId: string, hole: number, value: string) {
    setEdits({ ...edits, [`${regId}-${hole}`]: value });
  }

  async function saveScores() {
    setSaving(true);
    const entries = Object.entries(edits);
    for (const [key, value] of entries) {
      if (!value) continue;
      const [regId, holeStr] = key.split("-");
      const rawScore = parseInt(value);
      if (isNaN(rawScore) || rawScore < 1 || rawScore > 20) continue;

      await fetch(`/api/tournaments/${id}/scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId: regId,
          holeNumber: parseInt(holeStr),
          rawScore,
        }),
      });
    }
    setEdits({});
    await load();
    setSaving(false);
  }

  if (!tournament) {
    return (
      <>
        <Header />
        <main id="main" className="flex min-h-[60vh] items-center justify-center">
          <p className="text-text-muted">Loading...</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main id="main" className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <Link
            href={`/admin/tournaments/${id}`}
            className="text-sm text-text-muted hover:text-secondary"
          >
            &larr; Back to Tournament
          </Link>

          <h1 className="mt-4 text-2xl font-semibold text-secondary">
            Score Entry: {tournament.name}
          </h1>

          {/* Group selector */}
          <div className="mt-6 flex flex-wrap gap-2">
            {sortedGroups.map(([groupNum, regs]) => (
              <button
                key={groupNum}
                onClick={() => setSelectedGroup(groupNum)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  selectedGroup === groupNum
                    ? "bg-primary text-white"
                    : "bg-accent text-secondary hover:bg-primary/10"
                }`}
              >
                Group {groupNum || "Unassigned"} ({regs.length})
                {regs[0]?.teeTime && (
                  <span className="ml-1 opacity-70">{regs[0].teeTime}</span>
                )}
              </button>
            ))}
          </div>

          {/* Score grid */}
          {selectedGroup != null && currentGroupRegs.length > 0 && (
            <div className="mt-6">
              <div className="overflow-x-auto rounded-2xl border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-accent">
                      <th className="sticky left-0 z-10 bg-accent px-3 py-2 text-left font-medium text-text-muted">
                        Player
                      </th>
                      {holes.map((h) => (
                        <th
                          key={h.number}
                          className="px-2 py-2 text-center font-medium text-text-muted"
                        >
                          <div>{h.number}</div>
                          <div className="text-xs font-normal opacity-60">
                            P{h.par}
                          </div>
                        </th>
                      ))}
                      <th className="px-3 py-2 text-center font-medium text-text-muted">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentGroupRegs.map((r) => {
                      let total = 0;
                      let entered = 0;
                      holes.forEach((h) => {
                        const v = getScore(r.id, h.number);
                        if (v) {
                          total += parseInt(v) || 0;
                          entered++;
                        }
                      });

                      return (
                        <tr
                          key={r.id}
                          className="border-b border-border last:border-0"
                        >
                          <td className="sticky left-0 z-10 bg-surface-elevated px-3 py-2">
                            <div className="font-medium text-secondary">
                              {r.firstName} {r.lastName}
                            </div>
                            <div className="text-xs text-text-muted">
                              HCP {r.playingHandicap ?? "N/A"}
                            </div>
                          </td>
                          {holes.map((h) => (
                            <td key={h.number} className="px-1 py-1">
                              <input
                                type="number"
                                min={1}
                                max={20}
                                value={getScore(r.id, h.number)}
                                onChange={(e) =>
                                  setEdit(r.id, h.number, e.target.value)
                                }
                                className="w-10 rounded border border-border bg-surface px-1 py-1 text-center text-sm"
                              />
                            </td>
                          ))}
                          <td className="px-3 py-2 text-center font-bold text-secondary">
                            {entered > 0 ? total : "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex items-center gap-4">
                <button
                  onClick={saveScores}
                  disabled={saving || Object.keys(edits).length === 0}
                  className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Scores"}
                </button>
                <Link
                  href={`/tournaments/${id}`}
                  className="text-sm text-primary hover:underline"
                  target="_blank"
                >
                  View Public Leaderboard &rarr;
                </Link>
              </div>
            </div>
          )}

          {selectedGroup == null && (
            <p className="mt-8 text-text-muted">
              Select a group above to enter scores.
            </p>
          )}
        </div>
      </main>
    </>
  );
}
