"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import Link from "next/link";
import { use } from "react";

interface Registration {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  handicapIndexAtReg: number | null;
  playingHandicap: number | null;
  flightNumber: number | null;
  groupNumber: number | null;
  teeTime: string | null;
  status: string;
}

interface Tournament {
  id: string;
  name: string;
  date: string;
  format: string;
  status: string;
  courseId: string;
  teeName: string;
}

export default function AdminTournamentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [pairingMsg, setPairingMsg] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [interval, setInterval_] = useState(10);

  const load = useCallback(async () => {
    const [tRes, rRes] = await Promise.all([
      fetch(`/api/tournaments/${id}`),
      fetch(`/api/tournaments/${id}/registrations`),
    ]);
    if (tRes.ok) setTournament(await tRes.json());
    if (rRes.ok) setRegistrations(await rRes.json());
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function generatePairings() {
    setPairingMsg("Generating...");
    const res = await fetch(`/api/tournaments/${id}/pairings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startTime, intervalMinutes: interval }),
    });
    if (res.ok) {
      const data = await res.json();
      setPairingMsg(
        `Generated ${data.flights.length} flights, ${data.groups.length} groups`,
      );
      load();
    } else {
      const err = await res.json();
      setPairingMsg(`Error: ${err.error}`);
    }
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

  const active = registrations.filter((r) => r.status !== "withdrawn");
  const hasPairings = active.some((r) => r.flightNumber != null);

  return (
    <>
      <Header />
      <main id="main" className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <Link
            href="/admin/tournaments"
            className="text-sm text-text-muted hover:text-secondary"
          >
            &larr; All Tournaments
          </Link>

          <div className="mt-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-secondary">
                {tournament.name}
              </h1>
              <p className="mt-1 text-text-muted">
                {tournament.date} &middot; {tournament.format} &middot;{" "}
                {tournament.status}
              </p>
            </div>
            {tournament.status === "in_progress" && (
              <Link
                href={`/admin/tournaments/${id}/scoring`}
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
              >
                Enter Scores
              </Link>
            )}
          </div>

          {/* Pairings controls */}
          <div className="mt-8 rounded-2xl border border-border bg-surface-elevated p-6">
            <h2 className="font-semibold text-secondary">
              Pairings & Tee Times
            </h2>
            <div className="mt-4 flex flex-wrap items-end gap-4">
              <div>
                <label className="text-xs text-text-muted">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="mt-1 block rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-text-muted">
                  Interval (min)
                </label>
                <input
                  type="number"
                  value={interval}
                  onChange={(e) => setInterval_(parseInt(e.target.value))}
                  min={5}
                  max={15}
                  className="mt-1 block w-20 rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                />
              </div>
              <button
                onClick={generatePairings}
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
              >
                {hasPairings ? "Regenerate" : "Generate"} Pairings
              </button>
            </div>
            {pairingMsg && (
              <p className="mt-3 text-sm text-text-secondary">{pairingMsg}</p>
            )}
          </div>

          {/* Registrations table */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-secondary">
              Registrations ({active.length})
            </h2>
            <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-accent text-left">
                    <th className="px-4 py-3 font-medium text-text-muted">#</th>
                    <th className="px-4 py-3 font-medium text-text-muted">
                      Player
                    </th>
                    <th className="px-4 py-3 font-medium text-text-muted">
                      Email
                    </th>
                    <th className="px-4 py-3 font-medium text-text-muted">
                      HCP
                    </th>
                    <th className="px-4 py-3 font-medium text-text-muted">
                      Playing
                    </th>
                    <th className="px-4 py-3 font-medium text-text-muted">
                      Flight
                    </th>
                    <th className="px-4 py-3 font-medium text-text-muted">
                      Group
                    </th>
                    <th className="px-4 py-3 font-medium text-text-muted">
                      Tee Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {active.map((r, i) => (
                    <tr
                      key={r.id}
                      className="border-b border-border last:border-0"
                    >
                      <td className="px-4 py-3 text-text-muted">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-secondary">
                        {r.firstName} {r.lastName}
                      </td>
                      <td className="px-4 py-3 text-text-muted">{r.email}</td>
                      <td className="px-4 py-3">
                        {r.handicapIndexAtReg?.toFixed(1) ?? "-"}
                      </td>
                      <td className="px-4 py-3">{r.playingHandicap ?? "-"}</td>
                      <td className="px-4 py-3">
                        {r.flightNumber
                          ? String.fromCharCode(64 + r.flightNumber)
                          : "-"}
                      </td>
                      <td className="px-4 py-3">{r.groupNumber ?? "-"}</td>
                      <td className="px-4 py-3">{r.teeTime ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Public view link */}
          <div className="mt-6 text-sm text-text-muted">
            Public page:{" "}
            <Link
              href={`/tournaments/${id}`}
              className="text-primary hover:underline"
            >
              /tournaments/{id}
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
