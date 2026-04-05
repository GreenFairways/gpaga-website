"use client";

import { useState, useEffect, useCallback, use } from "react";
import Header from "@/components/Header";
import Link from "next/link";
import { getCourseInfo } from "@/data/courses/info";

const FORMAT_LABELS: Record<string, string> = {
  strokeplay: "Stroke Play",
  stableford: "Stableford",
  modified_stableford: "Modified Stableford",
  par_bogey: "Par / Bogey",
  match_play: "Match Play",
  skins: "Skins",
  scramble: "Scramble",
  best_ball: "Best Ball",
  shamble: "Shamble",
  greensome: "Greensome",
  foursomes: "Foursomes",
};

interface Tournament {
  id: string;
  name: string;
  date: string;
  format: string;
  status: string;
  tournamentType: string;
  visibility: string;
  courseId: string;
  teeName: string;
  maxPlayers: number;
}

interface Registration {
  id: string;
  playerId: string;
  firstName?: string;
  lastName?: string;
  handicapIndexAtReg: number | null;
  courseHandicap: number | null;
  playingHandicap: number | null;
  teeName: string | null;
  divisionLabel: string | null;
  status: string;
}

interface Invite {
  id: string;
  invitedPlayerId: string | null;
  invitedPlayerName: string | null;
  invitedEmail: string | null;
  inviteCode: string;
  status: string;
}

interface Organizer {
  id: string;
  playerId: string;
  role: string;
  playerName: string;
  email: string;
}

interface SearchResult {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  handicapIndex: number | null;
  registered: boolean;
}

const STATUS_OPTIONS = [
  "draft",
  "registration_open",
  "in_progress",
  "completed",
];

export default function PlayerTournamentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [playerId, setPlayerId] = useState<string | null>(null);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [isCreator, setIsCreator] = useState(false);

  // Add players
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [inviteMsg, setInviteMsg] = useState("");
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [guestFirst, setGuestFirst] = useState("");
  const [guestLast, setGuestLast] = useState("");
  const [guestGender, setGuestGender] = useState("M");

  // Co-organizer search
  const [orgQuery, setOrgQuery] = useState("");
  const [orgResults, setOrgResults] = useState<SearchResult[]>([]);
  const [orgMsg, setOrgMsg] = useState("");

  // Status update
  const [statusMsg, setStatusMsg] = useState("");

  const load = useCallback(async () => {
    const meRes = await fetch("/api/auth/me");
    if (!meRes.ok) {
      window.location.href = "/player/login";
      return;
    }
    const me = await meRes.json();
    setPlayerId(me.id);

    const [tRes, rRes, iRes, oRes] = await Promise.all([
      fetch(`/api/tournaments/${id}`),
      fetch(`/api/tournaments/${id}/registrations`),
      fetch(`/api/tournaments/${id}/invites`).catch(() => null),
      fetch(`/api/tournaments/${id}/organizers`),
    ]);

    if (tRes.ok) setTournament(await tRes.json());
    if (rRes.ok) setRegistrations(await rRes.json());
    if (iRes?.ok) setInvites(await iRes.json());
    if (oRes.ok) {
      const orgs: Organizer[] = await oRes.json();
      setOrganizers(orgs);
      setIsOrganizer(orgs.some((o) => o.playerId === me.id));
      setIsCreator(
        orgs.some((o) => o.playerId === me.id && o.role === "creator"),
      );
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Debounced player search for invites
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const res = await fetch(
        `/api/players/search?q=${encodeURIComponent(searchQuery)}`,
      );
      if (res.ok) setSearchResults(await res.json());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Debounced search for co-organizers
  useEffect(() => {
    if (orgQuery.length < 2) {
      setOrgResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const res = await fetch(
        `/api/players/search?q=${encodeURIComponent(orgQuery)}`,
      );
      if (res.ok) setOrgResults(await res.json());
    }, 300);
    return () => clearTimeout(timer);
  }, [orgQuery]);

  async function invitePlayer(pid: string) {
    setInviteMsg("");
    const res = await fetch(`/api/tournaments/${id}/invites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId: pid }),
    });
    if (res.ok) {
      setInviteMsg("Invite sent!");
      setSearchQuery("");
      setSearchResults([]);
      load();
    } else {
      const data = await res.json();
      setInviteMsg(data.error || "Failed");
    }
  }

  async function addExistingPlayer(pid: string) {
    setInviteMsg("");
    const res = await fetch(`/api/tournaments/${id}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId: pid }),
    });
    if (res.ok) {
      setInviteMsg("Player added!");
      setSearchQuery("");
      setSearchResults([]);
      load();
    } else {
      const data = await res.json();
      setInviteMsg(data.error || "Failed");
    }
  }

  async function addGuest() {
    if (!guestFirst.trim() || !guestLast.trim()) return;
    setInviteMsg("");
    const res = await fetch(`/api/tournaments/${id}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guestFirstName: guestFirst,
        guestLastName: guestLast,
        guestGender: guestGender,
      }),
    });
    if (res.ok) {
      setInviteMsg("Guest added!");
      setGuestFirst("");
      setGuestLast("");
      setShowGuestForm(false);
      load();
    } else {
      const data = await res.json();
      setInviteMsg(data.error || "Failed");
    }
  }

  async function deleteTournament() {
    if (!confirm("Delete this game? This cannot be undone.")) return;
    const res = await fetch(`/api/tournaments/${id}`, { method: "DELETE" });
    if (res.ok) {
      window.location.href = "/player";
    } else {
      const data = await res.json();
      setStatusMsg(data.error || "Failed to delete");
    }
  }

  async function removePlayer(registrationId: string) {
    const res = await fetch(`/api/tournaments/${id}/registrations/${registrationId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      load();
    }
  }

  async function addSelf() {
    setInviteMsg("");
    const res = await fetch(`/api/tournaments/${id}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (res.ok) {
      setInviteMsg("You're in!");
      load();
    } else {
      const data = await res.json();
      setInviteMsg(data.error || "Failed");
    }
  }

  async function addOrganizer(pid: string) {
    setOrgMsg("");
    const res = await fetch(`/api/tournaments/${id}/organizers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId: pid }),
    });
    if (res.ok) {
      setOrgMsg("Added!");
      setOrgQuery("");
      setOrgResults([]);
      load();
    } else {
      const data = await res.json();
      setOrgMsg(data.error || "Failed");
    }
  }

  async function removeOrganizer(pid: string) {
    const res = await fetch(`/api/tournaments/${id}/organizers`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId: pid }),
    });
    if (res.ok) load();
  }

  async function updateStatus(newStatus: string) {
    setStatusMsg("");
    const res = await fetch(`/api/tournaments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setStatusMsg(`Status updated to ${newStatus.replace(/_/g, " ")}`);
      load();
    } else {
      const data = await res.json();
      setStatusMsg(data.error || "Failed");
    }
  }

  function copyInviteLink(code: string) {
    const url = `${window.location.origin}/invite/${code}`;
    navigator.clipboard.writeText(url);
    setInviteMsg("Link copied!");
  }

  if (!tournament) {
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

  const active = registrations.filter((r) => r.status !== "withdrawn");

  return (
    <>
      <Header />
      <main id="main" className="mx-auto max-w-5xl px-6 py-10 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/player"
            className="text-sm font-medium text-primary hover:underline"
          >
            &larr; Dashboard
          </Link>
        </div>

        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-secondary">
              {tournament.name}
            </h1>
            <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-secondary">
              {tournament.visibility}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                tournament.status === "completed"
                  ? "bg-green-100 text-green-800"
                  : tournament.status === "in_progress"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {tournament.status.replace(/_/g, " ")}
            </span>
          </div>
          <p className="mt-2 text-sm text-text-muted">
            {tournament.date} &middot;{" "}
            {FORMAT_LABELS[tournament.format] || tournament.format} &middot;{" "}
            {getCourseInfo(tournament.courseId)?.shortName || tournament.courseId}
          </p>
        </div>

        {/* Status Management (organizer, only in draft/registration_open) */}
        {isOrganizer && !["in_progress", "completed"].includes(tournament.status) && (
          <div className="mb-6 rounded-xl border border-border bg-surface-elevated p-4">
            <h2 className="mb-3 text-sm font-semibold text-secondary">
              Tournament Status
            </h2>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => updateStatus(s)}
                  disabled={s === tournament.status}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    s === tournament.status
                      ? "bg-primary text-white"
                      : "border border-border text-text-secondary hover:bg-accent"
                  }`}
                >
                  {s.replace(/_/g, " ")}
                </button>
              ))}
            </div>
            {isCreator && tournament.status === "draft" && (
              <button
                onClick={deleteTournament}
                className="mt-3 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                Delete Game
              </button>
            )}
            {statusMsg && (
              <p className="mt-2 text-xs text-text-muted">{statusMsg}</p>
            )}
          </div>
        )}

        {/* Enter Scores CTA — visible for any registered player when in_progress */}
        {tournament.status === "in_progress" && playerId && active.some((r) => r.playerId === playerId) && (
          <div className="mb-6">
            <Link
              href={`/player/tournaments/${id}/scoring`}
              className="block w-full rounded-xl bg-primary px-4 py-4 text-center text-base font-semibold text-white hover:bg-primary-dark"
            >
              Enter Scores &rarr;
            </Link>
          </div>
        )}

        {/* Players */}
        <div className="mb-6 rounded-xl border border-border bg-surface-elevated p-4">
          <h2 className="mb-3 text-sm font-semibold text-secondary">
            Players ({active.length}/{tournament.maxPlayers})
          </h2>

          {active.length === 0 ? (
            <p className="text-sm text-text-muted">No players yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-text-muted">
                    <th className="pb-2 font-medium">Player</th>
                    <th className="pb-2 font-medium">HI</th>
                    <th className="pb-2 font-medium">PH</th>
                    <th className="pb-2 font-medium">Tee</th>
                    {isOrganizer && !["in_progress", "completed"].includes(tournament.status) && <th className="pb-2 font-medium"></th>}
                  </tr>
                </thead>
                <tbody>
                  {active.map((r) => (
                    <tr key={r.id} className="border-b border-border/50">
                      <td className="py-2 text-secondary">
                        {r.firstName && r.lastName
                          ? `${r.firstName} ${r.lastName}`
                          : r.playerId}
                      </td>
                      <td className="py-2 text-text-muted">
                        {r.handicapIndexAtReg?.toFixed(1) ?? "-"}
                      </td>
                      <td className="py-2 text-text-muted">
                        {r.playingHandicap ?? "-"}
                      </td>
                      <td className="py-2 text-text-muted">
                        {r.teeName || "-"}
                      </td>
                      {isOrganizer && !["in_progress", "completed"].includes(tournament.status) && (
                        <td className="py-2">
                          <button
                            onClick={() => removePlayer(r.id)}
                            className="text-xs text-red-500 hover:text-red-700"
                            title="Remove player"
                          >
                            &times;
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Start Game button */}
          {isOrganizer && active.length >= 2 && tournament.status === "draft" && (
            <div className="mt-4 border-t border-border pt-4">
              <button
                onClick={() => updateStatus("in_progress")}
                className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary-dark"
              >
                {tournament.tournamentType === "casual" ? "Start Game" : "Start Tournament"} ({active.length} players)
              </button>
            </div>
          )}

          {/* Add players (organizer, only before game starts) */}
          {isOrganizer && !["in_progress", "completed"].includes(tournament.status) && (
            <div className="mt-4 border-t border-border pt-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name..."
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              />

              {searchResults.length > 0 && (
                <div className="mt-2 space-y-1">
                  {searchResults
                    .filter((p) => p.id !== playerId)
                    .map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2"
                      >
                        <div>
                          <span className="text-sm font-medium text-secondary">
                            {p.firstName} {p.lastName}
                          </span>
                          {p.handicapIndex != null && (
                            <span className="ml-2 text-xs text-text-muted">
                              HI: {p.handicapIndex.toFixed(1)}
                            </span>
                          )}
                          {p.registered && (
                            <span className="ml-2 text-xs text-green-600">
                              registered
                            </span>
                          )}
                        </div>
                        {p.registered ? (
                          <button
                            onClick={() => invitePlayer(p.id)}
                            className="rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-white hover:bg-primary-dark"
                          >
                            Invite
                          </button>
                        ) : (
                          <button
                            onClick={() => addExistingPlayer(p.id)}
                            className="rounded-lg border border-primary px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/5"
                          >
                            Add
                          </button>
                        )}
                      </div>
                    ))}
                </div>
              )}

              {/* Add Guest */}
              {!showGuestForm ? (
                <button
                  type="button"
                  onClick={() => setShowGuestForm(true)}
                  className="mt-3 w-full rounded-lg border border-dashed border-border px-3 py-2.5 text-sm text-text-muted hover:border-primary/30 hover:text-secondary"
                >
                  + Add a guest (not registered)
                </button>
              ) : (
                <div className="mt-3 space-y-2 rounded-lg border border-border bg-surface p-3">
                  <p className="text-xs font-medium text-secondary">Add Guest Player</p>
                  <div className="grid grid-cols-5 gap-2">
                    <input
                      type="text"
                      placeholder="First Name"
                      value={guestFirst}
                      onChange={(e) => setGuestFirst(e.target.value)}
                      className="col-span-2 rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm"
                      autoFocus
                    />
                    <input
                      type="text"
                      placeholder="Last Name"
                      value={guestLast}
                      onChange={(e) => setGuestLast(e.target.value)}
                      className="col-span-2 rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm"
                    />
                    <select
                      value={guestGender}
                      onChange={(e) => setGuestGender(e.target.value)}
                      className="rounded-lg border border-border bg-surface-elevated px-2 py-2 text-sm"
                    >
                      <option value="M">M</option>
                      <option value="F">F</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={addGuest}
                      className="rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-white hover:bg-primary-dark"
                    >
                      Add Guest
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowGuestForm(false)}
                      className="text-xs text-text-muted hover:text-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {inviteMsg && (
                <p className="mt-2 text-xs text-text-muted">{inviteMsg}</p>
              )}

              {/* Pending invites */}
              {invites.length > 0 && (
                <div className="mt-4">
                  <h3 className="mb-2 text-xs font-medium text-text-muted">
                    Sent Invites
                  </h3>
                  <div className="space-y-1">
                    {invites.map((inv) => (
                      <div
                        key={inv.id}
                        className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2"
                      >
                        <div>
                          <span className="text-sm text-secondary">
                            {inv.invitedPlayerName ||
                              inv.invitedEmail ||
                              "Unknown"}
                          </span>
                          <span
                            className={`ml-2 text-xs ${
                              inv.status === "accepted"
                                ? "text-green-600"
                                : inv.status === "declined"
                                  ? "text-red-600"
                                  : "text-yellow-600"
                            }`}
                          >
                            {inv.status}
                          </span>
                        </div>
                        <button
                          onClick={() => copyInviteLink(inv.inviteCode)}
                          className="rounded-lg border border-border px-2 py-1 text-xs text-text-secondary hover:bg-accent"
                          title="Copy invite link"
                        >
                          Copy Link
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Co-Organizers (creator only, before game starts) */}
        {isCreator && !["in_progress", "completed"].includes(tournament.status) && (
          <div className="mb-6 rounded-xl border border-border bg-surface-elevated p-4">
            <h2 className="mb-3 text-sm font-semibold text-secondary">
              Co-Organizers
            </h2>

            <div className="mb-3 space-y-1">
              {organizers.map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2"
                >
                  <div>
                    <span className="text-sm font-medium text-secondary">
                      {o.playerName}
                    </span>
                    <span className="ml-2 text-xs text-text-muted">
                      {o.role.replace(/_/g, " ")}
                    </span>
                  </div>
                  {o.role !== "creator" && (
                    <button
                      onClick={() => removeOrganizer(o.playerId)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>

            <input
              type="text"
              value={orgQuery}
              onChange={(e) => setOrgQuery(e.target.value)}
              placeholder="Search to add co-organizer..."
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            />

            {orgResults.length > 0 && (
              <div className="mt-2 space-y-1">
                {orgResults
                  .filter(
                    (p) => !organizers.some((o) => o.playerId === p.id),
                  )
                  .map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2"
                    >
                      <span className="text-sm text-secondary">
                        {p.firstName} {p.lastName}
                      </span>
                      <button
                        onClick={() => addOrganizer(p.id)}
                        className="rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-white hover:bg-primary-dark"
                      >
                        Add
                      </button>
                    </div>
                  ))}
              </div>
            )}

            {orgMsg && (
              <p className="mt-2 text-xs text-text-muted">{orgMsg}</p>
            )}
          </div>
        )}
      </main>
    </>
  );
}
