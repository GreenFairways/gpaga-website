"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Link from "next/link";

interface MatchedProfile {
  id: string;
  firstName: string;
  lastName: string;
  handicapIndex: number | null;
  homeClub: string | null;
  gender: string;
}

type Step = "name" | "match" | "form";

export default function PlayerRegisterPage() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    gender: "M",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  // Two-step flow: name → match check → registration form
  const [step, setStep] = useState<Step>("name");
  const [matches, setMatches] = useState<MatchedProfile[]>([]);
  const [claimProfile, setClaimProfile] = useState<MatchedProfile | null>(null);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  // Step 1 → search public registries
  async function handleNameNext(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.firstName.trim().length < 2 || form.lastName.trim().length < 2) {
      setError("Please enter your full name");
      return;
    }

    setSearching(true);
    try {
      const res = await fetch(
        `/api/players/match?firstName=${encodeURIComponent(form.firstName.trim())}&lastName=${encodeURIComponent(form.lastName.trim())}`,
      );
      if (res.ok) {
        const found: MatchedProfile[] = await res.json();
        setMatches(found);
        setStep(found.length > 0 ? "match" : "form");
      } else {
        setStep("form");
      }
    } catch {
      setStep("form");
    }
    setSearching(false);
  }

  function selectProfile(profile: MatchedProfile) {
    setClaimProfile(profile);
    setForm((f) => ({ ...f, gender: profile.gender || f.gender }));
    setStep("form");
  }

  function skipImport() {
    setClaimProfile(null);
    setStep("form");
  }

  function goBackToName() {
    setClaimProfile(null);
    setMatches([]);
    setStep("name");
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: claimProfile?.firstName || form.firstName.trim(),
        lastName: claimProfile?.lastName || form.lastName.trim(),
        email: form.email,
        gender: form.gender,
        password: form.password,
        ...(claimProfile ? { claimPlayerId: claimProfile.id } : {}),
      }),
    });

    if (res.ok) {
      window.location.href = "/player";
    } else {
      const data = await res.json();
      setError(data.error || "Registration failed");
    }
    setLoading(false);
  }

  return (
    <>
      <Header />
      <main
        id="main"
        className="flex min-h-[60vh] items-center justify-center px-4 py-12"
      >
        <div className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-surface-elevated p-8">
          <h1 className="text-xl font-semibold text-secondary">
            Create Account
          </h1>

          {/* Step 1: Name input */}
          {step === "name" && (
            <form onSubmit={handleNameNext} className="space-y-4">
              <p className="text-sm text-text-muted">
                Enter your name to get started.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="First Name"
                  value={form.firstName}
                  onChange={(e) => update("firstName", e.target.value)}
                  className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                  required
                  autoFocus
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={form.lastName}
                  onChange={(e) => update("lastName", e.target.value)}
                  className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                  required
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={searching}
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
              >
                {searching ? "Searching..." : "Continue"}
              </button>

              <p className="text-center text-sm text-text-muted">
                Already have an account?{" "}
                <Link
                  href="/player/login"
                  className="font-medium text-primary hover:underline"
                >
                  Log in
                </Link>
              </p>
            </form>
          )}

          {/* Step 2: Match found — ask if this is them */}
          {step === "match" && (
            <div className="space-y-4">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <p className="mb-1 text-sm font-medium text-secondary">
                  We searched public golf registries and found a profile that may be yours.
                </p>
                <p className="text-xs text-text-muted">
                  Is this your AmGolf profile? Importing it will link your handicap history.
                </p>
              </div>

              <div className="space-y-2">
                {matches.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => selectProfile(m)}
                    className="flex w-full items-center justify-between rounded-lg border border-border bg-surface px-4 py-3 text-left transition-colors hover:border-primary/40"
                  >
                    <div>
                      <span className="text-sm font-medium text-secondary">
                        {m.firstName} {m.lastName}
                      </span>
                      {m.handicapIndex != null && (
                        <span className="ml-2 text-xs text-text-muted">
                          HI: {m.handicapIndex.toFixed(1)}
                        </span>
                      )}
                      {m.homeClub && (
                        <span className="ml-2 text-xs text-text-muted">
                          {m.homeClub}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-medium text-primary">
                      Yes, import
                    </span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={skipImport}
                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-text-muted hover:border-primary/30 hover:text-secondary"
              >
                No, create a new profile
              </button>

              <button
                type="button"
                onClick={goBackToName}
                className="w-full text-center text-xs text-text-muted hover:text-secondary"
              >
                Back
              </button>
            </div>
          )}

          {/* Step 3: Registration form */}
          {step === "form" && (
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Claimed profile banner */}
              {claimProfile && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-secondary">
                        Importing AmGolf profile
                      </p>
                      <p className="text-xs text-text-muted">
                        {claimProfile.firstName} {claimProfile.lastName}
                        {claimProfile.handicapIndex != null &&
                          ` · HI: ${claimProfile.handicapIndex.toFixed(1)}`}
                        {claimProfile.homeClub && ` · ${claimProfile.homeClub}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={goBackToName}
                      className="text-xs text-text-muted hover:text-secondary"
                    >
                      Change
                    </button>
                  </div>
                </div>
              )}

              {!claimProfile && (
                <div className="rounded-lg border border-border/50 bg-surface p-3">
                  <p className="text-xs text-text-muted">
                    Registering as{" "}
                    <span className="font-medium text-secondary">
                      {form.firstName} {form.lastName}
                    </span>
                    {" · "}
                    <button
                      type="button"
                      onClick={goBackToName}
                      className="text-primary hover:underline"
                    >
                      change
                    </button>
                  </p>
                </div>
              )}

              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                required
                autoFocus
              />

              {!claimProfile && (
                <select
                  value={form.gender}
                  onChange={(e) => update("gender", e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                >
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </select>
              )}

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                  required
                  minLength={8}
                />
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={form.confirmPassword}
                  onChange={(e) => update("confirmPassword", e.target.value)}
                  className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                  required
                  minLength={8}
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
              >
                {loading
                  ? "Creating account..."
                  : claimProfile
                    ? "Import Profile & Register"
                    : "Register"}
              </button>

              <p className="text-center text-sm text-text-muted">
                Already have an account?{" "}
                <Link
                  href="/player/login"
                  className="font-medium text-primary hover:underline"
                >
                  Log in
                </Link>
              </p>
            </form>
          )}
        </div>
      </main>
    </>
  );
}
