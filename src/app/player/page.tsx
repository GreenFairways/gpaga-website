"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import Link from "next/link";

interface PlayerProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  handicapIndex: number | null;
}

interface Tournament {
  id: string;
  name: string;
  date: string;
  format: string;
  status: string;
  tournamentType: string;
  visibility: string;
}

export default function PlayerDashboard() {
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const meRes = await fetch("/api/auth/me");
    if (!meRes.ok) {
      window.location.href = "/player/login";
      return;
    }
    const me = await meRes.json();
    setPlayer(me);

    const tRes = await fetch("/api/tournaments?mine=true");
    if (tRes.ok) setTournaments(await tRes.json());

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || !player) {
    return (
      <>
        <Header />
        <main
          id="main"
          className="flex min-h-[60vh] items-center justify-center"
        >
          <p className="text-text-muted">Loading...</p>
        </main>
      </>
    );
  }

  const upcoming = tournaments.filter(
    (t) => t.status !== "completed" && t.status !== "cancelled",
  );
  const completed = tournaments.filter((t) => t.status === "completed");

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <>
      <Header />
      <main id="main" className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        {/* Welcome */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-secondary">
              Welcome, {player.firstName}
            </h1>
            {player.handicapIndex != null && (
              <p className="mt-1 text-sm text-text-muted">
                Handicap Index: {player.handicapIndex.toFixed(1)}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <Link
              href="/player/tournaments/create"
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              Create Game
            </Link>
            <Link
              href="/player/profile"
              className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-text-secondary hover:bg-accent"
            >
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-text-secondary hover:bg-accent"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <StatCard label="My Games" value={tournaments.length} />
          <StatCard label="Upcoming" value={upcoming.length} />
          <StatCard label="Completed" value={completed.length} />
        </div>

        {/* Tournament List */}
        <h2 className="mb-4 text-lg font-semibold text-secondary">
          My Games
        </h2>

        {tournaments.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface-elevated p-8 text-center">
            <p className="text-text-muted">No games yet.</p>
            <Link
              href="/player/tournaments/create"
              className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
            >
              Create your first game
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {tournaments.map((t) => (
              <Link
                key={t.id}
                href={`/player/tournaments/${t.id}`}
                className="block rounded-xl border border-border bg-surface-elevated p-4 transition-colors hover:border-primary/30"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-secondary">{t.name}</h3>
                    <p className="mt-1 text-sm text-text-muted">
                      {t.date} &middot; {t.format} &middot; {t.visibility}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      t.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : t.status === "in_progress"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {t.status.replace(/_/g, " ")}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-surface-elevated p-5">
      <p className="text-sm text-text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold text-secondary">{value}</p>
    </div>
  );
}
