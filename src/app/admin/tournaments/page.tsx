"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Link from "next/link";

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
}

const COURSES = [
  { id: "tbilisi-hills", name: "Tbilisi Hills Golf Club" },
  { id: "tabori-paragraph", name: "Tabori Paragraph" },
];

export default function AdminTournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: "",
    date: "",
    courseId: "tbilisi-hills",
    teeName: "Silver",
    format: "strokeplay",
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
    setCreating(true);
    const res = await fetch("/api/tournaments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowCreate(false);
      loadTournaments();
      setForm({
        name: "",
        date: "",
        courseId: "tbilisi-hills",
        teeName: "Silver",
        format: "strokeplay",
        maxPlayers: 40,
        entryFeeLari: 0,
        handicapAllowance: 0.95,
        rules: "",
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
            <form
              onSubmit={handleCreate}
              className="mt-6 rounded-2xl border border-primary/20 bg-surface-elevated p-6"
            >
              <h2 className="font-semibold text-secondary">New Tournament</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
                  onChange={(e) =>
                    setForm({ ...form, courseId: e.target.value })
                  }
                  className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                >
                  {COURSES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <select
                  value={form.format}
                  onChange={(e) => setForm({ ...form, format: e.target.value })}
                  className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                >
                  <option value="strokeplay">Strokeplay</option>
                  <option value="stableford">Stableford</option>
                  <option value="matchplay">Match Play</option>
                </select>
                <input
                  type="text"
                  placeholder="Tee Name (e.g. Silver)"
                  value={form.teeName}
                  onChange={(e) =>
                    setForm({ ...form, teeName: e.target.value })
                  }
                  className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  placeholder="Max Players"
                  value={form.maxPlayers}
                  onChange={(e) =>
                    setForm({ ...form, maxPlayers: parseInt(e.target.value) })
                  }
                  className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  placeholder="Entry Fee (GEL)"
                  value={form.entryFeeLari}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      entryFeeLari: parseInt(e.target.value),
                    })
                  }
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
              <button
                type="submit"
                disabled={creating}
                className="mt-4 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create"}
              </button>
            </form>
          )}

          {/* Tournament list */}
          <div className="mt-8 space-y-4">
            {tournaments.map((t) => (
              <div
                key={t.id}
                className="flex flex-col gap-4 rounded-2xl border border-border bg-surface-elevated p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <Link
                    href={`/admin/tournaments/${t.id}`}
                    className="font-semibold text-secondary hover:text-primary"
                  >
                    {t.name}
                  </Link>
                  <p className="mt-1 text-sm text-text-muted">
                    {t.date} &middot;{" "}
                    {t.courseId.replace(/-/g, " ")} &middot; {t.format}
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
                      onClick={() =>
                        updateStatus(t.id, "registration_closed")
                      }
                      className="rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-200"
                    >
                      Close Registration
                    </button>
                  )}
                  {(t.status === "registration_closed" ||
                    t.status === "registration_open") && (
                    <button
                      onClick={() => updateStatus(t.id, "in_progress")}
                      className="rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-200"
                    >
                      Start Tournament
                    </button>
                  )}
                  {t.status === "in_progress" && (
                    <>
                      <Link
                        href={`/admin/tournaments/${t.id}/scoring`}
                        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-dark"
                      >
                        Enter Scores
                      </Link>
                      <button
                        onClick={() => updateStatus(t.id, "completed")}
                        className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
                      >
                        Finalize
                      </button>
                    </>
                  )}
                  <span className="rounded-md bg-accent px-3 py-1 text-xs font-medium text-secondary">
                    {t.status}
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
