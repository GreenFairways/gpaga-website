"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Link from "next/link";
import { courseInfos } from "@/data/courses/info";

export default function CreateTournamentPage() {
  const [authed, setAuthed] = useState(false);
  const [form, setForm] = useState({
    name: "",
    date: "",
    courseId: courseInfos[0].slug,
    teeName: courseInfos[0].teeNames[0],
    format: "strokeplay",
    visibility: "private" as string,
    maxPlayers: "20",
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/auth/me").then((res) => {
      if (!res.ok) {
        window.location.href = "/player/login";
        return;
      }
      setAuthed(true);
    });
  }, []);

  const selectedCourse = courseInfos.find((c) => c.slug === form.courseId);
  const teeNames = selectedCourse?.teeNames || [];

  function update(field: string, value: string) {
    setForm((f) => {
      const next = { ...f, [field]: value };
      // Reset tee when course changes
      if (field === "courseId") {
        const course = courseInfos.find((c) => c.slug === value);
        if (course) next.teeName = course.teeNames[0];
      }
      return next;
    });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCreating(true);

    const res = await fetch("/api/tournaments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        date: form.date,
        courseId: form.courseId,
        teeName: form.teeName,
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
      setError(data.error || "Failed to create tournament");
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
            Create Tournament
          </h1>
          <Link
            href="/player"
            className="text-sm font-medium text-primary hover:underline"
          >
            Back to Dashboard
          </Link>
        </div>

        <form
          onSubmit={handleCreate}
          className="space-y-4 rounded-2xl border border-border bg-surface-elevated p-6"
        >
          <label className="block">
            <span className="text-xs font-medium text-text-muted">
              Tournament Name
            </span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Saturday Round with Friends"
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              required
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

            <label className="block">
              <span className="text-xs font-medium text-text-muted">Tee</span>
              <select
                value={form.teeName}
                onChange={(e) => update("teeName", e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              >
                {teeNames.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-medium text-text-muted">Format</span>
              <select
                value={form.format}
                onChange={(e) => update("format", e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              >
                <option value="strokeplay">Strokeplay</option>
                <option value="stableford">Stableford</option>
              </select>
            </label>

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
            {creating ? "Creating..." : "Create Tournament"}
          </button>
        </form>
      </main>
    </>
  );
}
