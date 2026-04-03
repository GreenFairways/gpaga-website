"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Link from "next/link";

interface Division {
  label: string;
  name: string;
  format: string;
  holes: number;
  hcpRange: [number, number];
  tees: { gender: string; teeName: string; seniorAge?: number }[];
  tieBreak: string;
}

interface Tournament {
  id: string;
  name: string;
  date: string;
  courseId: string;
  teeName: string;
  format: string;
  status: string;
  maxPlayers: number;
  entryFeeLari: number;
  handicapAllowance: number;
  divisions: Division[] | null;
  formatConfig: Record<string, unknown>;
}

const COURSES = [
  { id: "tbilisi-hills", name: "Tbilisi Hills Golf Club" },
  { id: "tabori-paragraph", name: "Tabori Paragraph" },
];

// ──── Format Presets (cards) ────

interface FormatPreset {
  id: string;
  name: string;
  description: string;
  format: string;
  isTeam: boolean;
  formatConfig: Record<string, unknown>;
  divisions: Division[] | null;
}

const FORMAT_PRESETS: FormatPreset[] = [
  {
    id: "tbilisi-hills-abc",
    name: "Tbilisi Hills Standard",
    description: "A/B/C divisions: Strokeplay, Stableford, 9h Stableford",
    format: "strokeplay",
    isTeam: false,
    formatConfig: {},
    divisions: [
      {
        label: "A", name: "Division A", format: "strokeplay", holes: 18,
        hcpRange: [0, 18],
        tees: [{ gender: "M", teeName: "Silver" }, { gender: "F", teeName: "Green" }],
        tieBreak: "lower-handicap",
      },
      {
        label: "B", name: "Division B", format: "stableford", holes: 18,
        hcpRange: [18.1, 36],
        tees: [{ gender: "M", teeName: "Silver" }, { gender: "F", teeName: "Green" }],
        tieBreak: "lower-handicap",
      },
      {
        label: "C", name: "Division C", format: "stableford", holes: 9,
        hcpRange: [36.1, 54],
        tees: [{ gender: "M", teeName: "White" }, { gender: "F", teeName: "Green" }],
        tieBreak: "lower-handicap",
      },
    ],
  },
  {
    id: "open-strokeplay",
    name: "Open Strokeplay",
    description: "Single division, net strokeplay, all handicaps",
    format: "strokeplay",
    isTeam: false,
    formatConfig: {},
    divisions: null,
  },
  {
    id: "open-stableford",
    name: "Open Stableford",
    description: "Single division, stableford points, all handicaps",
    format: "stableford",
    isTeam: false,
    formatConfig: {},
    divisions: null,
  },
  {
    id: "scramble-2",
    name: "2-Ball Scramble",
    description: "Teams of 2. Best shot, all play from there. HCP: 35%/15%",
    format: "scramble",
    isTeam: true,
    formatConfig: {
      format: "scramble",
      teamSize: 2,
      handicapPercentages: [0.35, 0.15],
    },
    divisions: null,
  },
  {
    id: "scramble-4",
    name: "4-Ball Scramble",
    description: "Teams of 4. Best shot, all play from there. HCP: 10/20/30/40%",
    format: "scramble",
    isTeam: true,
    formatConfig: {
      format: "scramble",
      teamSize: 4,
      handicapPercentages: [0.10, 0.20, 0.30, 0.40],
    },
    divisions: null,
  },
  {
    id: "best-ball-4",
    name: "4-Ball Best Ball",
    description: "Teams of 4. Each plays own ball, best net score counts. HCP: 85%",
    format: "best_ball",
    isTeam: true,
    formatConfig: {
      format: "best_ball",
      teamSize: 4,
      bestCount: 1,
      playerAllowance: 0.85,
    },
    divisions: null,
  },
];

const FORMAT_LABELS: Record<string, string> = {
  strokeplay: "Strokeplay",
  stableford: "Stableford",
  scramble: "Scramble",
  best_ball: "Best Ball",
  match_play: "Match Play",
  greensome: "Greensome",
  foursomes: "Foursomes",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  registration_open: "bg-emerald-100 text-emerald-800",
  registration_closed: "bg-amber-100 text-amber-800",
  in_progress: "bg-blue-100 text-blue-800",
  suspended: "bg-red-100 text-red-800",
  completed: "bg-gray-200 text-gray-600",
  cancelled: "bg-red-200 text-red-700",
};

export default function AdminTournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<FormatPreset | null>(null);
  const [form, setForm] = useState({
    name: "",
    date: "",
    courseId: "tbilisi-hills",
    teeName: "Silver",
    maxPlayers: 40,
    entryFeeLari: 0,
    handicapAllowance: 0.95,
    rules: "",
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadTournaments();
  }, []);

  async function loadTournaments() {
    const res = await fetch("/api/tournaments");
    if (res.ok) setTournaments(await res.json());
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPreset) return;
    setCreating(true);

    const res = await fetch("/api/tournaments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        format: selectedPreset.format,
        divisions: selectedPreset.divisions,
        formatConfig: selectedPreset.formatConfig,
      }),
    });
    if (res.ok) {
      setShowCreate(false);
      setSelectedPreset(null);
      loadTournaments();
      setForm({
        name: "", date: "", courseId: "tbilisi-hills", teeName: "Silver",
        maxPlayers: 40, entryFeeLari: 0, handicapAllowance: 0.95, rules: "",
      });
    }
    setCreating(false);
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/tournaments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    loadTournaments();
  }

  const isTeam = (t: Tournament) =>
    ["scramble", "best_ball", "greensome", "foursomes", "shamble"].includes(t.format);

  return (
    <>
      <Header />
      <main id="main" className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-secondary">
              Tournaments
            </h1>
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
            >
              {showCreate ? "Cancel" : "Create Tournament"}
            </button>
          </div>

          {/* Create form */}
          {showCreate && (
            <div className="mt-6 rounded-2xl border border-primary/20 bg-surface-elevated p-6">
              <h2 className="font-semibold text-secondary">New Tournament</h2>

              {/* Step 1: Format selection cards */}
              {!selectedPreset && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {FORMAT_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => setSelectedPreset(preset)}
                      className="flex flex-col items-start rounded-xl border-2 border-border bg-surface p-4 text-left transition-all hover:border-primary hover:shadow-md"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-secondary">
                          {preset.name}
                        </span>
                        {preset.isTeam && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary-dark">
                            Team
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-text-muted">
                        {preset.description}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {/* Step 2: Details form (after preset selection) */}
              {selectedPreset && (
                <form onSubmit={handleCreate} className="mt-4">
                  <div className="mb-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedPreset(null)}
                      className="text-sm text-text-muted hover:text-secondary"
                    >
                      &larr; Back
                    </button>
                    <span className="rounded-lg bg-primary/10 px-3 py-1 text-sm font-medium text-primary-dark">
                      {selectedPreset.name}
                    </span>
                    {selectedPreset.isTeam && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-800">
                        Team Format
                      </span>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      type="text"
                      placeholder="Tournament Name *"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="rounded-lg border border-border bg-surface px-3 py-2 text-sm sm:col-span-2"
                    />
                    <input
                      type="date"
                      required
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                    />
                    <select
                      value={form.courseId}
                      onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                      className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                    >
                      {COURSES.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder={selectedPreset.isTeam ? "Max Teams" : "Max Players"}
                      value={form.maxPlayers}
                      onChange={(e) => setForm({ ...form, maxPlayers: parseInt(e.target.value) })}
                      className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Entry Fee (GEL)"
                      value={form.entryFeeLari}
                      onChange={(e) => setForm({ ...form, entryFeeLari: parseInt(e.target.value) })}
                      className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                    />
                    <textarea
                      placeholder="Rules (optional)"
                      value={form.rules}
                      onChange={(e) => setForm({ ...form, rules: e.target.value })}
                      className="rounded-lg border border-border bg-surface px-3 py-2 text-sm sm:col-span-2"
                      rows={3}
                    />
                  </div>

                  {/* Division preview */}
                  {selectedPreset.divisions && selectedPreset.divisions.length > 0 && (
                    <div className="mt-4 rounded-xl border border-border bg-accent p-4">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                        Divisions
                      </h3>
                      <div className="mt-2 space-y-2">
                        {selectedPreset.divisions.map((d) => (
                          <div
                            key={d.label}
                            className="flex items-center justify-between rounded-lg bg-surface px-3 py-2 text-sm"
                          >
                            <div>
                              <span className="font-semibold text-secondary">{d.name}</span>
                              <span className="ml-2 text-text-muted">
                                {d.format === "strokeplay" ? "Net Strokeplay" : "Stableford"} &middot; {d.holes}h
                              </span>
                            </div>
                            <div className="text-xs text-text-muted">
                              HCP {d.hcpRange[0]}-{d.hcpRange[1]}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Team format config preview */}
                  {selectedPreset.isTeam && selectedPreset.formatConfig && (
                    <div className="mt-4 rounded-xl border border-border bg-accent p-4">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                        Team Format
                      </h3>
                      <div className="mt-2 space-y-1 text-sm text-text-muted">
                        {"teamSize" in selectedPreset.formatConfig && (
                          <p>Team size: <span className="font-medium text-secondary">
                            {String(selectedPreset.formatConfig.teamSize)} players
                          </span></p>
                        )}
                        {"handicapPercentages" in selectedPreset.formatConfig && (
                          <p>Handicap formula: <span className="font-medium text-secondary">
                            {(selectedPreset.formatConfig.handicapPercentages as number[])
                              .map((p, i) => `${Math.round(p * 100)}% P${i + 1}`)
                              .join(" + ")}
                          </span></p>
                        )}
                        {"bestCount" in selectedPreset.formatConfig && (
                          <p>Best scores per hole: <span className="font-medium text-secondary">
                            {String(selectedPreset.formatConfig.bestCount)}
                          </span></p>
                        )}
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={creating}
                    className="mt-4 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
                  >
                    {creating ? "Creating..." : "Create Tournament"}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Tournament list */}
          <div className="mt-8 space-y-4">
            {tournaments.map((t) => (
              <div
                key={t.id}
                className="flex flex-col gap-4 rounded-2xl border border-border bg-surface-elevated p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/tournaments/${t.id}`}
                      className="font-semibold text-secondary hover:text-primary"
                    >
                      {t.name}
                    </Link>
                    {isTeam(t) && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary-dark">
                        Team
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-text-muted">
                    {t.date} &middot; {t.courseId.replace(/-/g, " ")} &middot;{" "}
                    {FORMAT_LABELS[t.format] || t.format}
                    {t.divisions && t.divisions.length > 0
                      ? ` \u00b7 ${t.divisions.map((d) => d.label).join("/")}`
                      : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {t.status === "draft" && (
                    <button
                      onClick={() => updateStatus(t.id, "registration_open")}
                      className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary-dark hover:bg-primary/20"
                    >
                      Open Registration
                    </button>
                  )}
                  {t.status === "registration_open" && (
                    <button
                      onClick={() => updateStatus(t.id, "registration_closed")}
                      className="rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-200"
                    >
                      Close Registration
                    </button>
                  )}
                  {(t.status === "registration_closed" || t.status === "registration_open") && (
                    <button
                      onClick={() => updateStatus(t.id, "in_progress")}
                      className="rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-200"
                    >
                      Start Tournament
                    </button>
                  )}
                  {t.status === "in_progress" && (
                    <>
                      {isTeam(t) ? (
                        <Link
                          href={`/admin/tournaments/${t.id}/teams`}
                          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-dark"
                        >
                          Manage Teams
                        </Link>
                      ) : (
                        <Link
                          href={`/admin/tournaments/${t.id}/scoring`}
                          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-dark"
                        >
                          Enter Scores
                        </Link>
                      )}
                      <button
                        onClick={() => updateStatus(t.id, "completed")}
                        className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
                      >
                        Finalize
                      </button>
                    </>
                  )}
                  {isTeam(t) && (t.status === "draft" || t.status === "registration_closed") && (
                    <Link
                      href={`/admin/tournaments/${t.id}/teams`}
                      className="rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-800 hover:bg-blue-200"
                    >
                      Teams
                    </Link>
                  )}
                  <span className={`rounded-md px-3 py-1 text-xs font-medium ${STATUS_COLORS[t.status] || "bg-accent text-secondary"}`}>
                    {t.status.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
