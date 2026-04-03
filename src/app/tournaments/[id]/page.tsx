"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { use } from "react";

interface DivisionDef {
  label: string;
  name: string;
  format: string;
  holes: number;
  hcpRange: [number, number];
  tees: { gender: string; teeName: string }[];
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
  rules: string;
  handicapAllowance: number;
  divisions: DivisionDef[] | null;
}

interface Registration {
  id: string;
  firstName: string;
  lastName: string;
  handicapIndexAtReg: number | null;
  playingHandicap: number | null;
  divisionLabel: string | null;
  flightNumber: number | null;
  groupNumber: number | null;
  teeTime: string | null;
  status: string;
}

const FORMAT_LABELS: Record<string, string> = {
  strokeplay: "Strokeplay",
  stableford: "Stableford",
  matchplay: "Match Play",
  match_play: "Match Play",
  scramble: "Scramble",
  best_ball: "Best Ball",
  greensome: "Greensome",
  foursomes: "Foursomes",
  shamble: "Shamble",
  skins: "Skins",
};

const TEAM_FORMATS = ["scramble", "best_ball", "greensome", "foursomes", "shamble"];

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
                  <InfoCard label="Format" value={
                    tournament.divisions && tournament.divisions.length > 0
                      ? `${tournament.divisions.length} Divisions`
                      : FORMAT_LABELS[tournament.format] || tournament.format
                  } />
                  <InfoCard label="Course" value={tournament.courseId.replace(/-/g, " ")} />
                  <InfoCard label="Tees" value={
                    tournament.divisions && tournament.divisions.length > 0
                      ? tournament.divisions.flatMap(d => d.tees.map(t => t.teeName)).filter((v, i, a) => a.indexOf(v) === i).join(" / ")
                      : tournament.teeName
                  } />
                  <InfoCard
                    label="Entry Fee"
                    value={
                      tournament.entryFeeLari > 0
                        ? `${tournament.entryFeeLari} GEL`
                        : "Free"
                    }
                  />
                </div>

                {/* Division cards */}
                {tournament.divisions && tournament.divisions.length > 0 && (
                  <div className="rounded-2xl border border-border bg-surface-elevated p-6">
                    <h3 className="font-semibold text-secondary">Divisions</h3>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      {tournament.divisions.map((d) => (
                        <div
                          key={d.label}
                          className="rounded-xl border border-border bg-accent p-4"
                        >
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                              {d.label}
                            </span>
                            <span className="font-semibold text-secondary">
                              {d.name}
                            </span>
                          </div>
                          <div className="mt-3 space-y-1 text-sm text-text-secondary">
                            <p>
                              {d.format === "strokeplay" ? "Net Strokeplay" : "Stableford"}{" "}
                              &middot; {d.holes} holes
                            </p>
                            <p>HCP {d.hcpRange[0]} - {d.hcpRange[1]}</p>
                            <p className="text-xs text-text-muted">
                              {d.tees.map((t) => `${t.gender === "M" ? "Men" : "Women"}: ${t.teeName}`).join(", ")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Registration status */}
                {tournament.status === "registration_open" && (
                  <div className="rounded-2xl border border-primary/20 bg-surface-elevated p-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-secondary">Registration Open</h3>
                        <p className="text-sm text-text-muted">
                          Contact the tournament director or register via the GPAGA member app.
                        </p>
                      </div>
                    </div>
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
            <th className="px-4 py-3 font-medium text-text-muted">Div</th>
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
                {r.divisionLabel ? (
                  <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                    {r.divisionLabel}
                  </span>
                ) : "-"}
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
  teamId?: string;
  teamName?: string;
  teamMembers?: string[];
}

interface DivisionLeaderboard {
  division: DivisionDef;
  entries: LeaderboardEntryType[];
}

function LeaderboardView({
  tournamentId,
  format,
}: {
  tournamentId: string;
  format: string;
}) {
  const [entries, setEntries] = useState<LeaderboardEntryType[] | null>(null);
  const [divisionBoards, setDivisionBoards] = useState<DivisionLeaderboard[] | null>(null);
  const [activeDivision, setActiveDivision] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      const res = await fetch(`/api/tournaments/${tournamentId}/leaderboard`);
      if (res.ok) {
        const data = await res.json();
        if (data.divisions) {
          setDivisionBoards(data.divisions);
          setEntries(null);
          if (!activeDivision && data.divisions.length > 0) {
            setActiveDivision(data.divisions[0].division.label);
          }
        } else {
          setEntries(data.entries);
          setDivisionBoards(null);
        }
      }
      setLoading(false);
    }

    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 15000);
    return () => clearInterval(interval);
  }, [tournamentId, activeDivision]);

  if (loading) {
    return <p className="text-text-muted">Loading leaderboard...</p>;
  }

  // Per-division leaderboard
  if (divisionBoards) {
    const activeBoard = divisionBoards.find(
      (db) => db.division.label === activeDivision,
    );

    return (
      <div className="space-y-4">
        {/* Division tabs */}
        <div className="flex gap-1 rounded-xl bg-accent p-1">
          {divisionBoards.map((db) => (
            <button
              key={db.division.label}
              onClick={() => setActiveDivision(db.division.label)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeDivision === db.division.label
                  ? "bg-surface-elevated text-secondary shadow-sm"
                  : "text-text-muted hover:text-secondary"
              }`}
            >
              {db.division.name}
              <span className="ml-1 text-xs text-text-muted">
                ({db.division.format === "strokeplay" ? "Net" : "Stableford"}
                {db.division.holes === 9 ? " 9h" : ""})
              </span>
            </button>
          ))}
        </div>

        {activeBoard && activeBoard.entries.length > 0 ? (
          <LeaderboardTable
            entries={activeBoard.entries}
            isStableford={activeBoard.division.format === "stableford"}
            holes={activeBoard.division.holes}
          />
        ) : (
          <p className="text-text-muted">No scores entered yet for this division.</p>
        )}
      </div>
    );
  }

  // Legacy single leaderboard
  if (!entries || entries.length === 0) {
    return <p className="text-text-muted">No scores entered yet.</p>;
  }

  const isTeam = TEAM_FORMATS.includes(format);

  return (
    <LeaderboardTable
      entries={entries}
      isStableford={format === "stableford"}
      holes={18}
      isTeamFormat={isTeam}
    />
  );
}

function LeaderboardTable({
  entries,
  isStableford,
  holes,
  isTeamFormat = false,
}: {
  entries: LeaderboardEntryType[];
  isStableford: boolean;
  holes: number;
  isTeamFormat?: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-accent text-left">
            <th className="px-4 py-3 font-medium text-text-muted">Pos</th>
            <th className="px-4 py-3 font-medium text-text-muted">
              {isTeamFormat ? "Team" : "Player"}
            </th>
            <th className="px-4 py-3 font-medium text-text-muted">
              {isTeamFormat ? "Team HCP" : "Playing HCP"}
            </th>
            {isStableford ? (
              <th className="px-4 py-3 font-medium text-text-muted">Points</th>
            ) : (
              <>
                <th className="px-4 py-3 font-medium text-text-muted">Gross</th>
                <th className="px-4 py-3 font-medium text-text-muted">Net</th>
                <th className="px-4 py-3 font-medium text-text-muted">To Par</th>
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
              <td className="px-4 py-3">
                <div className="font-medium text-secondary">
                  {isTeamFormat ? (e.teamName ?? e.playerName) : e.playerName}
                </div>
                {isTeamFormat && e.teamMembers && e.teamMembers.length > 0 && (
                  <div className="mt-0.5 text-xs text-text-muted">
                    {e.teamMembers.join(", ")}
                  </div>
                )}
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
                {e.thru === holes ? "F" : e.thru}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
