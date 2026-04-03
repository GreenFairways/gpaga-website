"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Link from "next/link";

interface Tournament {
  id: string;
  name: string;
  date: string;
  format: string;
  status: string;
}

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    // Check if already logged in by fetching players (admin-only)
    fetch("/api/players").then((res) => {
      if (res.ok) {
        setLoggedIn(true);
        loadTournaments();
      }
    });
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setLoggedIn(true);
      setPassword("");
      loadTournaments();
    } else {
      setError("Invalid password");
    }
  }

  async function loadTournaments() {
    const res = await fetch("/api/tournaments");
    if (res.ok) {
      setTournaments(await res.json());
      setDbReady(true);
    }
  }

  async function initDb() {
    const res = await fetch("/api/db/init", { method: "POST" });
    if (res.ok) {
      setDbReady(true);
      loadTournaments();
    }
  }

  if (!loggedIn) {
    return (
      <>
        <Header />
        <main
          id="main"
          className="flex min-h-[60vh] items-center justify-center"
        >
          <form
            onSubmit={handleLogin}
            className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-surface-elevated p-8"
          >
            <h1 className="text-xl font-semibold text-secondary">
              Admin Login
            </h1>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              autoFocus
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              Login
            </button>
          </form>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main id="main" className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-secondary">
              Admin Dashboard
            </h1>
            <div className="flex gap-3">
              {!dbReady && (
                <button
                  onClick={initDb}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
                >
                  Initialize Database
                </button>
              )}
              <Link
                href="/admin/tournaments"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
              >
                Manage Tournaments
              </Link>
            </div>
          </div>

          {/* Quick stats */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Total Tournaments"
              value={tournaments.length.toString()}
            />
            <StatCard
              label="Active"
              value={tournaments
                .filter(
                  (t) =>
                    t.status === "registration_open" ||
                    t.status === "in_progress",
                )
                .length.toString()}
            />
            <StatCard
              label="Completed"
              value={tournaments
                .filter((t) => t.status === "completed")
                .length.toString()}
            />
          </div>

          {/* Recent tournaments */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-secondary">
              Recent Tournaments
            </h2>
            <div className="mt-4 space-y-3">
              {tournaments.slice(0, 5).map((t) => (
                <Link
                  key={t.id}
                  href={`/admin/tournaments/${t.id}`}
                  className="flex items-center justify-between rounded-xl border border-border bg-surface-elevated p-4 hover:border-primary/30"
                >
                  <div>
                    <p className="font-medium text-secondary">{t.name}</p>
                    <p className="text-sm text-text-muted">{t.date}</p>
                  </div>
                  <span className="rounded-md bg-accent px-3 py-1 text-xs font-medium text-secondary">
                    {t.status}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface-elevated p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold text-secondary">{value}</p>
    </div>
  );
}
