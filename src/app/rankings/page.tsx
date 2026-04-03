"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface MeritEntry {
  playerId: string;
  playerName: string;
  totalPoints: number;
  tournamentsPlayed: number;
  bestFinish: number;
  results: {
    tournamentName: string;
    position: number;
    points: number;
    date: string;
  }[];
}

export default function RankingsPage() {
  const [entries, setEntries] = useState<MeritEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/merit");
        if (res.ok) setEntries(await res.json());
      } catch {
        // DB not ready
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <>
      <Header />
      <main id="main" className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-widest text-primary">
              Rankings
            </p>
            <h1
              className="mt-3 font-semibold text-secondary"
              style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)" }}
            >
              Order of Merit 2026
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-text-secondary">
              Season-long standings based on tournament results. Points are
              awarded for finishing positions across all GPAGA events.
            </p>
          </div>

          <div className="mt-12">
            {loading ? (
              <p className="text-text-muted">Loading rankings...</p>
            ) : entries.length === 0 ? (
              <p className="text-text-muted">
                No completed tournaments yet. Rankings will appear after the
                first event.
              </p>
            ) : (
              <div className="space-y-3">
                {entries.map((e, i) => (
                  <div key={e.playerId}>
                    <button
                      onClick={() =>
                        setExpanded(
                          expanded === e.playerId ? null : e.playerId,
                        )
                      }
                      className="flex w-full items-center gap-4 rounded-2xl border border-border bg-surface-elevated p-5 text-left transition-colors hover:border-primary/30"
                    >
                      {/* Position */}
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold ${
                          i === 0
                            ? "bg-amber-100 text-amber-700"
                            : i === 1
                              ? "bg-gray-100 text-gray-600"
                              : i === 2
                                ? "bg-orange-100 text-orange-700"
                                : "bg-accent text-secondary"
                        }`}
                      >
                        {i + 1}
                      </div>

                      <div className="flex-1">
                        <h3 className="font-semibold text-secondary">
                          {e.playerName}
                        </h3>
                        <p className="mt-0.5 text-sm text-text-muted">
                          {e.tournamentsPlayed} tournament
                          {e.tournamentsPlayed !== 1 ? "s" : ""} &middot; Best
                          finish: {e.bestFinish > 0 ? ordinal(e.bestFinish) : "N/A"}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                          {e.totalPoints}
                        </p>
                        <p className="text-xs text-text-muted">points</p>
                      </div>
                    </button>

                    {/* Expanded results */}
                    {expanded === e.playerId && (
                      <div className="mt-1 ml-16 rounded-xl border border-border bg-accent p-4">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-text-muted">
                              <th className="pb-2 font-medium">Tournament</th>
                              <th className="pb-2 font-medium">Date</th>
                              <th className="pb-2 font-medium">Position</th>
                              <th className="pb-2 font-medium">Points</th>
                            </tr>
                          </thead>
                          <tbody>
                            {e.results.map((r, j) => (
                              <tr key={j} className="border-t border-border/50">
                                <td className="py-2 font-medium text-secondary">
                                  {r.tournamentName}
                                </td>
                                <td className="py-2 text-text-muted">
                                  {r.date}
                                </td>
                                <td className="py-2">{ordinal(r.position)}</td>
                                <td className="py-2 font-medium text-primary">
                                  {r.points}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
