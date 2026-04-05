"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Link from "next/link";
import { courseInfos } from "@/data/courses/info";

const FORMAT_OPTIONS = [
  { group: "Individual", formats: [
    { value: "strokeplay", label: "Stroke Play" },
    { value: "stableford", label: "Stableford" },
    { value: "modified_stableford", label: "Modified Stableford" },
    { value: "par_bogey", label: "Par / Bogey" },
    { value: "match_play", label: "Match Play" },
    { value: "skins", label: "Skins" },
  ]},
  { group: "Team", formats: [
    { value: "scramble", label: "Scramble" },
    { value: "best_ball", label: "Best Ball" },
    { value: "shamble", label: "Shamble" },
    { value: "greensome", label: "Greensome" },
    { value: "foursomes", label: "Foursomes (Alternate Shot)" },
  ]},
];

type GameType = "game" | "tournament";

function defaultGameName(firstName: string, type: GameType): string {
  return type === "game"
    ? `${firstName}'s Game`
    : `${firstName}'s Tournament`;
}

export default function CreateTournamentPage() {
  const [authed, setAuthed] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [gameType, setGameType] = useState<GameType>("game");
  const [form, setForm] = useState({
    name: "",
    date: "",
    courseId: courseInfos[0].slug,
    format: "strokeplay",
    visibility: "private" as string,
    maxPlayers: "4",
  });
  const [customName, setCustomName] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/auth/me").then(async (res) => {
      if (!res.ok) {
        window.location.href = "/player/login";
        return;
      }
      const me = await res.json();
      setPlayerName(me.firstName);
      setForm((f) => ({
        ...f,
        name: defaultGameName(me.firstName, "game"),
      }));
      setAuthed(true);
    });
  }, []);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function selectGameType(type: GameType) {
    setGameType(type);
    setForm((f) => ({
      ...f,
      maxPlayers: type === "game" ? "4" : "20",
      ...(!customName && playerName ? { name: defaultGameName(playerName, type) } : {}),
    }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCreating(true);

    const gameName = form.name.trim() || defaultGameName(playerName || "My", gameType);

    const res = await fetch("/api/tournaments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: gameName,
        date: form.date,
        courseId: form.courseId,
        format: form.format,
        visibility: form.visibility,
        maxPlayers: parseInt(form.maxPlayers) || 20,
        formatConfig: {},
      }),
    });

    if (res.ok) {
      const tournament = await res.json();
      window.location.href = `/player/tournaments/${tournament.id}`;
    } else {
      const data = await res.json();
      setError(data.error || "Failed to create");
    }
    setCreating(false);
  }

  if (!authed) {
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
      <main id="main" className="mx-auto max-w-2xl px-6 py-10 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-secondary">
            Create Game
          </h1>
          <Link
            href="/player"
            className="text-sm font-medium text-primary hover:underline"
          >
            Back to Dashboard
          </Link>
        </div>

        {/* Game type selector */}
        <div className="mb-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => selectGameType("game")}
            className={`rounded-xl border p-4 text-left transition-colors ${
              gameType === "game"
                ? "border-primary bg-primary/5"
                : "border-border bg-surface-elevated hover:border-primary/30"
            }`}
          >
            <p className="text-sm font-semibold text-secondary">Regular Game</p>
            <p className="mt-1 text-xs text-text-muted">
              A round with friends. One flight, casual scoring.
            </p>
          </button>
          <button
            type="button"
            onClick={() => selectGameType("tournament")}
            className={`rounded-xl border p-4 text-left transition-colors ${
              gameType === "tournament"
                ? "border-primary bg-primary/5"
                : "border-border bg-surface-elevated hover:border-primary/30"
            }`}
          >
            <p className="text-sm font-semibold text-secondary">Tournament</p>
            <p className="mt-1 text-xs text-text-muted">
              Multiple flights, leaderboard, full competition.
            </p>
          </button>
        </div>

        <form
          onSubmit={handleCreate}
          className="space-y-4 rounded-2xl border border-border bg-surface-elevated p-6"
        >
          <label className="block">
            <span className="text-xs font-medium text-text-muted">
              {gameType === "game" ? "Game Name" : "Tournament Name"}
            </span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => { update("name", e.target.value); setCustomName(true); }}
              placeholder={defaultGameName(playerName || "My", gameType)}
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              autoFocus
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-medium text-text-muted">Date</span>
              <input
                type="date"
                value={form.date}
                onChange={(e) => update("date", e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                required
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium text-text-muted">Course</span>
              <select
                value={form.courseId}
                onChange={(e) => update("courseId", e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              >
                {courseInfos.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.shortName}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="text-xs font-medium text-text-muted">Format</span>
            <select
              value={form.format}
              onChange={(e) => update("format", e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            >
              {FORMAT_OPTIONS.map((group) => (
                <optgroup key={group.group} label={group.group}>
                  {group.formats.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-medium text-text-muted">
                Visibility
              </span>
              <select
                value={form.visibility}
                onChange={(e) => update("visibility", e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              >
                <option value="private">Private (invite only)</option>
                <option value="unlisted">Unlisted (anyone with link)</option>
                <option value="public">Public</option>
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-medium text-text-muted">
                Max Players
              </span>
              <input
                type="number"
                value={form.maxPlayers}
                onChange={(e) => update("maxPlayers", e.target.value)}
                min={2}
                max={200}
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              />
            </label>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={creating}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
          >
            {creating
              ? "Creating..."
              : gameType === "game"
                ? "Create Game"
                : "Create Tournament"}
          </button>
        </form>
      </main>
    </>
  );
}
