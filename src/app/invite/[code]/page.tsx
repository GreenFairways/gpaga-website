"use client";

import { useState, useEffect, use } from "react";
import Header from "@/components/Header";
import Link from "next/link";

interface InviteInfo {
  tournamentId: string;
  tournamentName: string;
  tournamentDate: string;
  inviterName: string;
  status: string;
}

export default function InviteAcceptPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);

  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/invites/${code}`).then((res) =>
        res.ok ? res.json() : null,
      ),
      fetch("/api/auth/me").then((res) => res.ok),
    ]).then(([inviteData, isAuthed]) => {
      if (inviteData) setInvite(inviteData);
      setAuthed(isAuthed);
      setLoading(false);
    });
  }, [code]);

  async function handleAccept() {
    setError("");
    setAccepting(true);

    const res = await fetch(`/api/invites/${code}`, { method: "POST" });
    if (res.ok) {
      setDone(true);
    } else {
      const data = await res.json();
      setError(data.error || "Failed to accept invite");
    }
    setAccepting(false);
  }

  if (loading) {
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

  if (!invite) {
    return (
      <>
        <Header />
        <main
          id="main"
          className="flex min-h-[60vh] items-center justify-center px-4"
        >
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface-elevated p-8 text-center">
            <h1 className="text-xl font-semibold text-secondary">
              Invite Not Found
            </h1>
            <p className="mt-2 text-sm text-text-muted">
              This invite link may be expired or invalid.
            </p>
            <Link
              href="/"
              className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
            >
              Go to Home
            </Link>
          </div>
        </main>
      </>
    );
  }

  if (done) {
    return (
      <>
        <Header />
        <main
          id="main"
          className="flex min-h-[60vh] items-center justify-center px-4"
        >
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface-elevated p-8 text-center">
            <h1 className="text-xl font-semibold text-green-700">
              You&apos;re In!
            </h1>
            <p className="mt-2 text-sm text-text-muted">
              You&apos;ve been registered for {invite.tournamentName}.
            </p>
            <Link
              href={`/tournaments/${invite.tournamentId}`}
              className="mt-4 inline-block rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              View Tournament
            </Link>
          </div>
        </main>
      </>
    );
  }

  if (invite.status !== "pending") {
    return (
      <>
        <Header />
        <main
          id="main"
          className="flex min-h-[60vh] items-center justify-center px-4"
        >
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface-elevated p-8 text-center">
            <h1 className="text-xl font-semibold text-secondary">
              Invite Already {invite.status === "accepted" ? "Accepted" : "Used"}
            </h1>
            <p className="mt-2 text-sm text-text-muted">
              This invite for {invite.tournamentName} has already been{" "}
              {invite.status}.
            </p>
            <Link
              href={`/tournaments/${invite.tournamentId}`}
              className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
            >
              View Tournament
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main
        id="main"
        className="flex min-h-[60vh] items-center justify-center px-4"
      >
        <div className="w-full max-w-sm rounded-2xl border border-border bg-surface-elevated p-8 text-center">
          <h1 className="text-xl font-semibold text-secondary">
            Tournament Invite
          </h1>
          <div className="mt-4 space-y-2">
            <p className="text-lg font-medium text-secondary">
              {invite.tournamentName}
            </p>
            <p className="text-sm text-text-muted">{invite.tournamentDate}</p>
            <p className="text-sm text-text-muted">
              Invited by {invite.inviterName}
            </p>
          </div>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

          {authed ? (
            <button
              onClick={handleAccept}
              disabled={accepting}
              className="mt-6 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
            >
              {accepting ? "Accepting..." : "Accept Invite"}
            </button>
          ) : (
            <div className="mt-6 space-y-3">
              <Link
                href={`/player/login?redirect=/invite/${code}`}
                className="block w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
              >
                Log In to Accept
              </Link>
              <Link
                href="/player/register"
                className="block text-sm font-medium text-primary hover:underline"
              >
                New player? Register first
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
