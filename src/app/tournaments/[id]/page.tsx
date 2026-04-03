"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { use } from "react";

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
  rules: string;
  handicapAllowance: number;
}

interface Registration {
  id: string;
  firstName: string;
  lastName: string;
  handicapIndexAtReg: number | null;
  playingHandicap: number | null;
  flightNumber: number | null;
  groupNumber: number | null;
  teeTime: string | null;
  status: string;
}

const FORMAT_LABELS: Record<string, string> = {
  strokeplay: "Strokeplay",
  stableford: "Stableford",
  matchplay: "Match Play",
};

export default function TournamentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [activeTab, setActiveTab] = useState<
    "info" | "participants" | "teetimes" | "leaderboard"
  >("info");
  const [regForm, setRegForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    gender: "M" as "M" | "F",
    handicapIndex: "",
    phone: "",
  });
  const [regStatus, setRegStatus] = useState<string | null>(null);

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

  if (!tournament) {
    return (
      <>
        <Header />
        <main id="main" className="flex min-h-[60vh] items-center justify-center">
          <p className="text-text-muted">Loading...</p>
        </main>
        <Footer />
      </>
    );
  }

  const canRegister = tournament.status === "registration_open";
  const hasScores =
    tournament.status === "in_progress" || tournament.status === "completed";
  const hasPairings = registrations.some((r) => r.flightNumber != null);

  // Group registrations by flight and group
  const byFlight = new Map<number, Registration[]>();
  const byGroup = new Map<number, Registration[]>();
  for (const r of registrations) {
    if (r.flightNumber != null) {
      const arr = byFlight.get(r.flightNumber) || [];
      arr.push(r);
      byFlight.set(r.flightNumber, arr);
    }
    if (r.groupNumber != null) {
      const arr = byGroup.get(r.groupNumber) || [];
      arr.push(r);
      byGroup.set(r.groupNumber, arr);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setRegStatus(null);

    const res = await fetch(`/api/tournaments/${id}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: regForm.firstName,
        lastName: regForm.lastName,
        email: regForm.email,
        gender: regForm.gender,
        handicapIndex: regForm.handicapIndex
          ? parseFloat(regForm.handicapIndex)
          : null,
        phone: regForm.phone || null,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setRegStatus(
        `Registered! Your access code: ${data.accessCode}. Save it for score entry.`,
      );
      load();
      setRegForm({
        firstName: "",
        lastName: "",
        email: "",
        gender: "M",
        handicapIndex: "",
        phone: "",
      });
    } else {
      const err = await res.json();
      setRegStatus(`Error: ${err.error}`);
    }
  }

  return (
    <>
      <Header />
      <main id="main" className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <Link
              href="/tournaments"
              className="text-sm text-text-muted hover:text-secondary"
            >
              &larr; All Tournaments
            </Link>
            <h1
              className="font-semibold text-secondary"
              style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)" }}
            >
              {tournament.name}
            </h1>
            <p className="text-text-secondary">
              {new Date(tournament.date + "T00:00:00").toLocaleDateString(
                "en-US",
                { weekday: "long", month: "long", day: "numeric", year: "numeric" },
              )}{" "}
              &middot; {FORMAT_LABELS[tournament.format] || tournament.format}{" "}
              &middot; {registrations.filter((r) => r.status !== "withdrawn").length}
              /{tournament.maxPlayers} players
            </p>
          </div>

          {/* Tabs */}
          <div className="mt-8 flex gap-1 rounded-xl bg-accent p-1">
            {(
              [
                { key: "info", label: "Info" },
                { key: "participants", label: `Participants (${registrations.length})` },
                ...(hasPairings
                  ? [{ key: "teetimes", label: "Tee Times" }]
                  : []),
                ...(hasScores
                  ? [{ key: "leaderboard", label: "Leaderboard" }]
                  : []),
              ] as { key: typeof activeTab; label: string }[]
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "bg-surface-elevated text-secondary shadow-sm"
                    : "text-text-muted hover:text-secondary"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="mt-8">
            {activeTab === "info" && (
              <div className="space-y-8">
                {/* Tournament rules */}
                {tournament.rules && (
                  <div className="rounded-2xl border border-border bg-surface-elevated p-6">
                    <h3 className="font-semibold text-secondary">Rules</h3>
                    <div className="mt-3 whitespace-pre-wrap text-sm text-text-secondary">
                      {tournament.rules}
                    </div>
                  </div>
                )}

                {/* Details */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <InfoCard label="Format" value={FORMAT_LABELS[tournament.format] || tournament.format} />
                  <InfoCard label="Course" value={tournament.courseId.replace(/-/g, " ")} />
                  <InfoCard label="Tees" value={tournament.teeName} />
                  <InfoCard
                    label="Entry Fee"
                    value={
                      tournament.entryFeeLari > 0
                        ? `${tournament.entryFeeLari} GEL`
                        : "Free"
                    }
                  />
                </div>

                {/* Registration form */}
                {canRegister && (
                  <div className="rounded-2xl border border-primary/20 bg-surface-elevated p-6">
                    <h3 className="font-semibold text-secondary">Register</h3>
                    <form
                      onSubmit={handleRegister}
                      className="mt-4 grid gap-4 sm:grid-cols-2"
                    >
                      <input
                        type="text"
                        placeholder="First Name *"
                        required
                        value={regForm.firstName}
                        onChange={(e) =>
                          setRegForm({ ...regForm, firstName: e.target.value })
                        }
                        className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Last Name *"
                        required
                        value={regForm.lastName}
                        onChange={(e) =>
                          setRegForm({ ...regForm, lastName: e.target.value })
                        }
                        className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                      />
                      <input
                        type="email"
                        placeholder="Email *"
                        required
                        value={regForm.email}
                        onChange={(e) =>
                          setRegForm({ ...regForm, email: e.target.value })
                        }
                        className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                      />
                      <input
                        type="tel"
                        placeholder="Phone"
                        value={regForm.phone}
                        onChange={(e) =>
                          setRegForm({ ...regForm, phone: e.target.value })
                        }
                        className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                      />
                      <div className="flex gap-4">
                        <select
                          value={regForm.gender}
                          onChange={(e) =>
                            setRegForm({
                              ...regForm,
                              gender: e.target.value as "M" | "F",
                            })
                          }
                          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                        >
                          <option value="M">Men</option>
                          <option value="F">Women</option>
                        </select>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="54"
                          placeholder="Handicap Index"
                          value={regForm.handicapIndex}
                          onChange={(e) =>
                            setRegForm({
                              ...regForm,
                              handicapIndex: e.target.value,
                            })
                          }
                          className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                        />
                      </div>
                      <button
                        type="submit"
                        className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark sm:col-span-2"
                      >
                        Register
                      </button>
                    </form>
                    {regStatus && (
                      <p
                        className={`mt-4 text-sm ${
                          regStatus.startsWith("Error")
                            ? "text-red-600"
                            : "text-emerald-600"
                        }`}
                      >
                        {regStatus}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "participants" && (
              <ParticipantsTable registrations={registrations} />
            )}

            {activeTab === "teetimes" && (
              <TeeTimesView byGroup={byGroup} byFlight={byFlight} />
            )}

            {activeTab === "leaderboard" && (
              <LeaderboardView tournamentId={id} format={tournament.format} />
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface-elevated p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold capitalize text-secondary">
        {value}
      </p>
    </div>
  );
}

function ParticipantsTable({
  registrations,
}: {
  registrations: Registration[];
}) {
  const active = registrations.filter((r) => r.status !== "withdrawn");

  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-accent text-left">
            <th className="px-4 py-3 font-medium text-text-muted">#</th>
            <th className="px-4 py-3 font-medium text-text-muted">Player</th>
            <th className="px-4 py-3 font-medium text-text-muted">HCP Index</th>
            <th className="px-4 py-3 font-medium text-text-muted">
              Playing HCP
            </th>
            <th className="px-4 py-3 font-medium text-text-muted">Flight</th>
            <th className="px-4 py-3 font-medium text-text-muted">Status</th>
          </tr>
        </thead>
        <tbody>
          {active.map((r, i) => (
            <tr
              key={r.id}
              className="border-b border-border last:border-0 hover:bg-accent/50"
            >
              <td className="px-4 py-3 text-text-muted">{i + 1}</td>
              <td className="px-4 py-3 font-medium text-secondary">
                {r.firstName} {r.lastName}
              </td>
              <td className="px-4 py-3">
                {r.handicapIndexAtReg != null
                  ? r.handicapIndexAtReg.toFixed(1)
                  : "N/A"}
              </td>
              <td className="px-4 py-3">
                {r.playingHandicap != null ? r.playingHandicap : "N/A"}
              </td>
              <td className="px-4 py-3">
                {r.flightNumber != null ? `Flight ${String.fromCharCode(64 + r.flightNumber)}` : "-"}
              </td>
              <td className="px-4 py-3">
                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary-dark">
                  {r.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {active.length === 0 && (
        <p className="p-8 text-center text-text-muted">
          No registrations yet.
        </p>
      )}
    </div>
  );
}

function TeeTimesView({
  byGroup,
  byFlight,
}: {
  byGroup: Map<number, Registration[]>;
  byFlight: Map<number, Registration[]>;
}) {
  const sortedGroups = [...byGroup.entries()].sort(([a], [b]) => a - b);

  return (
    <div className="space-y-6">
      {/* Flights summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...byFlight.entries()]
          .sort(([a], [b]) => a - b)
          .map(([num, regs]) => (
            <div
              key={num}
              className="rounded-xl border border-border bg-surface-elevated p-4"
            >
              <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
                Flight {String.fromCharCode(64 + num)}
              </p>
              <p className="mt-1 text-2xl font-bold text-secondary">
                {regs.length} players
              </p>
            </div>
          ))}
      </div>

      {/* Tee times */}
      <div className="space-y-4">
        {sortedGroups.map(([groupNum, regs]) => (
          <div
            key={groupNum}
            className="rounded-2xl border border-border bg-surface-elevated p-5"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-secondary">
                Group {groupNum}
              </h3>
              <div className="flex items-center gap-3">
                {regs[0]?.flightNumber && (
                  <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary-dark">
                    Flight{" "}
                    {String.fromCharCode(64 + regs[0].flightNumber)}
                  </span>
                )}
                <span className="text-sm font-medium text-text-secondary">
                  {regs[0]?.teeTime || "TBA"}
                </span>
              </div>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {regs.map((r) => (
                <div
                  key={r.id}
                  className="rounded-lg bg-accent px-3 py-2 text-sm"
                >
                  <span className="font-medium text-secondary">
                    {r.firstName} {r.lastName}
                  </span>
                  <span className="ml-2 text-text-muted">
                    HCP {r.playingHandicap ?? "N/A"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {sortedGroups.length === 0 && (
        <p className="text-text-muted">
          Tee times have not been assigned yet.
        </p>
      )}
    </div>
  );
}

interface LeaderboardEntryType {
  position: number;
  tied: boolean;
  playerName: string;
  playingHandicap: number;
  grossTotal: number;
  netTotal: number;
  toPar: number;
  stablefordTotal: number | null;
  thru: number;
}

function LeaderboardView({
  tournamentId,
  format,
}: {
  tournamentId: string;
  format: string;
}) {
  const [entries, setEntries] = useState<LeaderboardEntryType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      const res = await fetch(`/api/tournaments/${tournamentId}/leaderboard`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries);
      }
      setLoading(false);
    }

    fetchLeaderboard();
    // Poll every 15 seconds for live updates
    const interval = setInterval(fetchLeaderboard, 15000);
    return () => clearInterval(interval);
  }, [tournamentId]);

  if (loading) {
    return <p className="text-text-muted">Loading leaderboard...</p>;
  }

  if (entries.length === 0) {
    return <p className="text-text-muted">No scores entered yet.</p>;
  }

  const isStableford = format === "stableford";

  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-accent text-left">
            <th className="px-4 py-3 font-medium text-text-muted">Pos</th>
            <th className="px-4 py-3 font-medium text-text-muted">Player</th>
            <th className="px-4 py-3 font-medium text-text-muted">
              Playing HCP
            </th>
            {isStableford ? (
              <th className="px-4 py-3 font-medium text-text-muted">Points</th>
            ) : (
              <>
                <th className="px-4 py-3 font-medium text-text-muted">
                  Gross
                </th>
                <th className="px-4 py-3 font-medium text-text-muted">Net</th>
                <th className="px-4 py-3 font-medium text-text-muted">
                  To Par
                </th>
              </>
            )}
            <th className="px-4 py-3 font-medium text-text-muted">Thru</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e, i) => (
            <tr
              key={i}
              className="border-b border-border last:border-0 hover:bg-accent/50"
            >
              <td className="px-4 py-3 font-medium text-secondary">
                {e.tied ? `T${e.position}` : e.position}
              </td>
              <td className="px-4 py-3 font-medium text-secondary">
                {e.playerName}
              </td>
              <td className="px-4 py-3">{e.playingHandicap}</td>
              {isStableford ? (
                <td className="px-4 py-3 font-bold text-primary">
                  {e.stablefordTotal}
                </td>
              ) : (
                <>
                  <td className="px-4 py-3">{e.grossTotal}</td>
                  <td className="px-4 py-3 font-medium">{e.netTotal}</td>
                  <td
                    className={`px-4 py-3 font-bold ${
                      e.toPar < 0
                        ? "text-primary"
                        : e.toPar > 0
                          ? "text-red-600"
                          : "text-secondary"
                    }`}
                  >
                    {e.toPar > 0 ? `+${e.toPar}` : e.toPar === 0 ? "E" : e.toPar}
                  </td>
                </>
              )}
              <td className="px-4 py-3 text-text-muted">
                {e.thru === 18 ? "F" : e.thru}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
