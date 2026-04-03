"use client";

import { useState, useEffect, use } from "react";
import Header from "@/components/Header";
import Link from "next/link";

interface TeamMember {
  registrationId: string;
  playerId: string;
  firstName: string;
  lastName: string;
  handicapIndex: number | null;
  playingHandicap: number | null;
}

interface Team {
  id: string;
  name: string;
  teamHandicap: number | null;
  members: TeamMember[];
}

interface Registration {
  id: string;
  playerId: string;
  firstName: string;
  lastName: string;
  handicapIndex: number | null;
  playingHandicap: number | null;
  teamId: string | null;
}

interface Tournament {
  id: string;
  name: string;
  format: string;
  formatConfig: Record<string, unknown>;
}

export default function TeamManagementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [unassigned, setUnassigned] = useState<Registration[]>([]);
  const [newTeamName, setNewTeamName] = useState("");
  const [loading, setLoading] = useState(true);
  const [scoringTeamId, setScoringTeamId] = useState<string | null>(null);
  const [holeScores, setHoleScores] = useState<Record<number, string>>({});

  useEffect(() => {
    loadAll();
  }, [id]);

  async function loadAll() {
    setLoading(true);
    const [tRes, teamsRes, regsRes] = await Promise.all([
      fetch(`/api/tournaments/${id}`),
      fetch(`/api/tournaments/${id}/teams`),
      fetch(`/api/tournaments/${id}/registrations`),
    ]);

    if (tRes.ok) setTournament(await tRes.json());
    const teamsData: Team[] = teamsRes.ok ? await teamsRes.json() : [];
    setTeams(teamsData);

    if (regsRes.ok) {
      const regs: Registration[] = await regsRes.json();
      const assignedRegIds = new Set(
        teamsData.flatMap((t) => t.members.map((m) => m.registrationId)),
      );
      setUnassigned(
        regs
          .filter((r) => !assignedRegIds.has(r.id))
          .map((r) => {
            // API returns joined player fields
            const row = r as unknown as Record<string, string | number | null>;
            return {
              id: r.id,
              playerId: r.playerId,
              firstName: (row.firstName as string) ?? "",
              lastName: (row.lastName as string) ?? "",
              handicapIndex: r.handicapIndex,
              playingHandicap: r.playingHandicap,
              teamId: r.teamId,
            };
          }),
      );
    }
    setLoading(false);
  }

  async function createTeam() {
    if (!newTeamName.trim()) return;
    await fetch(`/api/tournaments/${id}/teams`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newTeamName }),
    });
    setNewTeamName("");
    loadAll();
  }

  async function addMember(teamId: string, registrationId: string) {
    await fetch(`/api/tournaments/${id}/teams/${teamId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registrationId }),
    });
    loadAll();
  }

  async function removeMember(teamId: string, registrationId: string) {
    await fetch(`/api/tournaments/${id}/teams/${teamId}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registrationId }),
    });
    loadAll();
  }

  async function deleteTeam(teamId: string) {
    await fetch(`/api/tournaments/${id}/teams/${teamId}`, {
      method: "DELETE",
    });
    loadAll();
  }

  async function saveScores(teamId: string) {
    const scores = Object.entries(holeScores)
      .filter(([, v]) => v !== "")
      .map(([hole, score]) => ({
        holeNumber: parseInt(hole),
        rawScore: parseInt(score),
      }));

    await fetch(`/api/tournaments/${id}/teams/${teamId}/scores`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scores }),
    });
    setScoringTeamId(null);
    setHoleScores({});
  }

  if (loading) {
    return (
      <>
        <Header />
        <main className="py-16 text-center text-text-muted">Loading...</main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main id="main" className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <Link
                href={`/admin/tournaments/${id}`}
                className="text-sm text-text-muted hover:text-primary"
              >
                &larr; Back to tournament
              </Link>
              <h1 className="mt-1 text-2xl font-semibold text-secondary">
                Teams &mdash; {tournament?.name}
              </h1>
              <p className="text-sm text-text-muted">
                Format: {tournament?.format?.replace(/_/g, " ")}
                {"teamSize" in (tournament?.formatConfig ?? {}) &&
                  ` \u00b7 ${String((tournament?.formatConfig as Record<string, unknown>).teamSize)} players per team`}
              </p>
            </div>
            <Link
              href={`/tournaments/${id}`}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-secondary hover:bg-primary/10"
            >
              View Public Page
            </Link>
          </div>

          {/* Create team */}
          <div className="mt-6 flex gap-2">
            <input
              type="text"
              placeholder="Team name..."
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createTeam()}
              className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            />
            <button
              onClick={createTeam}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
            >
              Create Team
            </button>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {/* Teams */}
            <div className="lg:col-span-2 space-y-4">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className="rounded-2xl border border-border bg-surface-elevated p-5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-secondary">{team.name}</h3>
                      {team.teamHandicap != null && (
                        <span className="rounded-md bg-accent px-2 py-0.5 text-xs text-text-muted">
                          Team HCP: {team.teamHandicap}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setScoringTeamId(scoringTeamId === team.id ? null : team.id);
                          setHoleScores({});
                        }}
                        className="rounded-lg bg-primary/10 px-3 py-1 text-xs font-medium text-primary-dark hover:bg-primary/20"
                      >
                        {scoringTeamId === team.id ? "Cancel" : "Enter Scores"}
                      </button>
                      <button
                        onClick={() => deleteTeam(team.id)}
                        className="rounded-lg bg-red-50 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Members */}
                  <div className="mt-3 space-y-1">
                    {team.members.map((m) => (
                      <div
                        key={m.registrationId}
                        className="flex items-center justify-between rounded-lg bg-surface px-3 py-2 text-sm"
                      >
                        <span>
                          {m.firstName} {m.lastName}
                          <span className="ml-2 text-text-muted">
                            HCP {m.handicapIndex ?? "N/A"} / PH {m.playingHandicap ?? "N/A"}
                          </span>
                        </span>
                        <button
                          onClick={() => removeMember(team.id, m.registrationId)}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    {team.members.length === 0 && (
                      <p className="py-2 text-center text-xs text-text-muted">
                        No members. Drag players from the unassigned list.
                      </p>
                    )}
                  </div>

                  {/* Add member dropdown */}
                  {unassigned.length > 0 && (
                    <select
                      className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-xs"
                      value=""
                      onChange={(e) => {
                        if (e.target.value) addMember(team.id, e.target.value);
                      }}
                    >
                      <option value="">+ Add player...</option>
                      {unassigned.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.firstName} {r.lastName} (HCP{" "}
                          {r.handicapIndex ?? "N/A"})
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Score entry */}
                  {scoringTeamId === team.id && (
                    <div className="mt-4 rounded-xl border border-primary/20 bg-accent p-4">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                        Scorecard
                      </h4>
                      <div className="mt-2 grid grid-cols-9 gap-1">
                        {Array.from({ length: 18 }, (_, i) => i + 1).map((hole) => (
                          <div key={hole} className="text-center">
                            <label className="text-[10px] text-text-muted">{hole}</label>
                            <input
                              type="number"
                              min={1}
                              max={15}
                              value={holeScores[hole] ?? ""}
                              onChange={(e) =>
                                setHoleScores({ ...holeScores, [hole]: e.target.value })
                              }
                              className="w-full rounded border border-border bg-surface px-1 py-1 text-center text-sm"
                            />
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => saveScores(team.id)}
                        className="mt-3 rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-white hover:bg-primary-dark"
                      >
                        Save Scores
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {teams.length === 0 && (
                <div className="rounded-2xl border-2 border-dashed border-border p-10 text-center text-text-muted">
                  No teams yet. Create one above and add registered players.
                </div>
              )}
            </div>

            {/* Unassigned players sidebar */}
            <div>
              <h3 className="font-semibold text-secondary">
                Unassigned Players ({unassigned.length})
              </h3>
              <div className="mt-3 space-y-1">
                {unassigned.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-lg bg-surface-elevated px-3 py-2 text-sm"
                  >
                    {r.firstName} {r.lastName}
                    <span className="ml-1 text-text-muted">
                      HCP {r.handicapIndex ?? "N/A"}
                    </span>
                  </div>
                ))}
                {unassigned.length === 0 && (
                  <p className="text-xs text-text-muted">
                    All registered players are assigned to teams.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
