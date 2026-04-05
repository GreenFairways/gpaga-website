"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Link from "next/link";

interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  gender: string;
  handicapIndex: number | null;
  phone: string | null;
  homeClub: string | null;
  dateOfBirth: string | null;
}

export default function PlayerProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    phone: "",
    homeClub: "",
    handicapIndex: "",
    dateOfBirth: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("/api/auth/me").then(async (res) => {
      if (!res.ok) {
        window.location.href = "/player/login";
        return;
      }
      const data = await res.json();
      setProfile(data);
      setForm({
        phone: data.phone || "",
        homeClub: data.homeClub || "",
        handicapIndex: data.handicapIndex != null ? String(data.handicapIndex) : "",
        dateOfBirth: data.dateOfBirth || "",
      });
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    const res = await fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: form.phone || null,
        homeClub: form.homeClub || null,
        handicapIndex: form.handicapIndex ? parseFloat(form.handicapIndex) : null,
        dateOfBirth: form.dateOfBirth || null,
      }),
    });

    if (res.ok) {
      const updated = await res.json();
      setProfile(updated);
      setEditing(false);
      setSuccess("Profile updated");
    } else {
      const data = await res.json();
      setError(data.error || "Failed to update");
    }
    setSaving(false);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  if (!profile) {
    return (
      <>
        <Header />
        <main id="main" className="flex min-h-[60vh] items-center justify-center">
          <p className="text-text-muted">Loading...</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main id="main" className="mx-auto max-w-2xl px-6 py-10 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-secondary">My Profile</h1>
          <Link
            href="/player"
            className="text-sm font-medium text-primary hover:underline"
          >
            Back to Dashboard
          </Link>
        </div>

        <div className="rounded-2xl border border-border bg-surface-elevated p-6">
          {/* Read-only fields */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <Field label="First Name" value={profile.firstName} />
            <Field label="Last Name" value={profile.lastName} />
            <Field label="Email" value={profile.email} />
            <Field label="Gender" value={profile.gender === "M" ? "Male" : "Female"} />
          </div>

          <hr className="mb-6 border-border" />

          {editing ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-medium text-text-muted">Phone</span>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-text-muted">Home Club</span>
                  <input
                    type="text"
                    value={form.homeClub}
                    onChange={(e) => setForm({ ...form, homeClub: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-text-muted">Handicap Index</span>
                  <input
                    type="number"
                    step="0.1"
                    value={form.handicapIndex}
                    onChange={(e) => setForm({ ...form, handicapIndex: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-text-muted">Date of Birth</span>
                  <input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                  />
                </label>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-text-secondary hover:bg-accent"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Phone" value={profile.phone || "Not set"} />
                <Field label="Home Club" value={profile.homeClub || "Not set"} />
                <Field
                  label="Handicap Index"
                  value={profile.handicapIndex != null ? profile.handicapIndex.toFixed(1) : "Not set"}
                />
                <Field label="Date of Birth" value={profile.dateOfBirth || "Not set"} />
              </div>

              {success && <p className="mt-4 text-sm text-green-600">{success}</p>}

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => { setEditing(true); setSuccess(""); }}
                  className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
                >
                  Edit Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="rounded-lg border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-text-muted">{label}</p>
      <p className="mt-1 text-sm text-secondary">{value}</p>
    </div>
  );
}
