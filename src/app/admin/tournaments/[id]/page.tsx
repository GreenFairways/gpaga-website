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

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  handicapIndex: number | null;
  gender: string;
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
  const [players, setPlayers] = useState<Player[]>([]);
  const [pairingMsg, setPairingMsg] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [interval, setInterval_] = useState(10);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [playerSearch, setPlayerSearch] = useState("");
  const [regMsg, setRegMsg] = useState("");
  const [showNewPlayer, setShowNewPlayer] = useState(false);
  const [newPlayer, setNewPlayer] = useState({
    firstName: "",
    lastName: "",
    email: "",
    gender: "M",
    handicapIndex: "",
    phone: "",
  });

  const load = useCallback(async () => {
    const [tRes, rRes, pRes] = await Promise.all([
      fetch(`/api/tournaments/${id}`),
      fetch(`/api/tournaments/${id}/registrations`),
      fetch(`/api/players`),
    ]);
    if (tRes.ok) setTournament(await tRes.json());
    if (rRes.ok) setRegistrations(await rRes.json());
    if (pRes.ok) setPlayers(await pRes.json());
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

          {/* Add Player */}
          <div className="mt-8 rounded-2xl border border-border bg-surface-elevated p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-secondary">
                Register Players
              </h2>
              <button
                onClick={() => setShowAddPlayer(!showAddPlayer)}
                className="text-sm text-primary hover:underline"
              >
                {showAddPlayer ? "Close" : "+ Add Player"}
              </button>
            </div>

            {regMsg && (
              <p className="mt-3 text-sm text-green-600">{regMsg}</p>
            )}

            {showAddPlayer && (
              <div className="mt-4">
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={playerSearch}
                  onChange={(e) => setPlayerSearch(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                />

                {playerSearch.length >= 2 && (
                  <div className="mt-2 max-h-60 overflow-y-auto rounded-lg border border-border">
                    {players
                      .filter((p) => {
                        const q = playerSearch.toLowerCase();
                        const alreadyRegistered = registrations.some(
                          (r) =>
                            r.email === p.email && r.status !== "withdrawn",
                        );
                        return (
                          !alreadyRegistered &&
                          (`${p.firstName} ${p.lastName}`
                            .toLowerCase()
                            .includes(q) ||
                            p.email.toLowerCase().includes(q))
                        );
                      })
                      .slice(0, 10)
                      .map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between border-b border-border px-4 py-2 last:border-0"
                        >
                          <div>
                            <span className="font-medium text-secondary">
                              {p.firstName} {p.lastName}
                            </span>
                            <span className="ml-2 text-xs text-text-muted">
                              {p.email}
                            </span>
                            <span className="ml-2 text-xs text-text-muted">
                              HCP: {p.handicapIndex?.toFixed(1) ?? "N/A"}
                            </span>
                          </div>
                          <button
                            onClick={async () => {
                              const res = await fetch(
                                `/api/tournaments/${id}/register`,
                                {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({ playerId: p.id }),
                                },
                              );
                              if (res.ok) {
                                const data = await res.json();
                                setRegMsg(
                                  `Registered ${data.playerName} (HCP: ${data.playingHandicap ?? "N/A"})`,
                                );
                                load();
                              } else {
                                const err = await res.json();
                                setRegMsg(`Error: ${err.error}`);
                              }
                            }}
                            className="rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-white hover:bg-primary-dark"
                          >
                            Register
                          </button>
                        </div>
                      ))}
                    {players.filter((p) => {
                      const q = playerSearch.toLowerCase();
                      return (
                        `${p.firstName} ${p.lastName}`
                          .toLowerCase()
                          .includes(q) ||
                        p.email.toLowerCase().includes(q)
                      );
                    }).length === 0 && (
                      <p className="px-4 py-3 text-sm text-text-muted">
                        No matching players found.
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-4 border-t border-border pt-4">
                  <button
                    onClick={() => setShowNewPlayer(!showNewPlayer)}
                    className="text-sm text-text-muted hover:text-secondary"
                  >
                    {showNewPlayer
                      ? "Cancel new player"
                      : "Player not in database? Create new"}
                  </button>

                  {showNewPlayer && (
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <input
                        placeholder="First Name *"
                        value={newPlayer.firstName}
                        onChange={(e) =>
                          setNewPlayer({
                            ...newPlayer,
                            firstName: e.target.value,
                          })
                        }
                        className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                      />
                      <input
                        placeholder="Last Name *"
                        value={newPlayer.lastName}
                        onChange={(e) =>
                          setNewPlayer({
                            ...newPlayer,
                            lastName: e.target.value,
                          })
                        }
                        className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                      />
                      <input
                        placeholder="Email *"
                        value={newPlayer.email}
                        onChange={(e) =>
                          setNewPlayer({
                            ...newPlayer,
                            email: e.target.value,
                          })
                        }
                        className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                      />
                      <select
                        value={newPlayer.gender}
                        onChange={(e) =>
                          setNewPlayer({
                            ...newPlayer,
                            gender: e.target.value,
                          })
                        }
                        className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                      >
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                      </select>
                      <input
                        placeholder="Handicap Index"
                        value={newPlayer.handicapIndex}
                        onChange={(e) =>
                          setNewPlayer({
                            ...newPlayer,
                            handicapIndex: e.target.value,
                          })
                        }
                        className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                      />
                      <input
                        placeholder="Phone"
                        value={newPlayer.phone}
                        onChange={(e) =>
                          setNewPlayer({
                            ...newPlayer,
                            phone: e.target.value,
                          })
                        }
                        className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                      />
                      <button
                        onClick={async () => {
                          if (
                            !newPlayer.firstName ||
                            !newPlayer.lastName ||
                            !newPlayer.email
                          ) {
                            setRegMsg(
                              "First name, last name and email are required",
                            );
                            return;
                          }
                          // Create player then register
                          const pRes = await fetch("/api/players", {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                              firstName: newPlayer.firstName,
                              lastName: newPlayer.lastName,
                              email: newPlayer.email,
                              gender: newPlayer.gender,
                              handicapIndex: newPlayer.handicapIndex
                                ? parseFloat(newPlayer.handicapIndex)
                                : null,
                              phone: newPlayer.phone || null,
                            }),
                          });
                          if (!pRes.ok) {
                            const err = await pRes.json();
                            setRegMsg(`Error creating player: ${err.error}`);
                            return;
                          }
                          const player = await pRes.json();
                          // Now register
                          const rRes = await fetch(
                            `/api/tournaments/${id}/register`,
                            {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify({ playerId: player.id }),
                            },
                          );
                          if (rRes.ok) {
                            const data = await rRes.json();
                            setRegMsg(
                              `Created & registered ${data.playerName}`,
                            );
                            setNewPlayer({
                              firstName: "",
                              lastName: "",
                              email: "",
                              gender: "M",
                              handicapIndex: "",
                              phone: "",
                            });
                            setShowNewPlayer(false);
                            load();
                          } else {
                            const err = await rRes.json();
                            setRegMsg(`Error registering: ${err.error}`);
                          }
                        }}
                        className="col-span-2 rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-white hover:bg-secondary/90 sm:col-span-1"
                      >
                        Create & Register
                      </button>
                    </div>
                  )}
                </div>
              </div>
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
