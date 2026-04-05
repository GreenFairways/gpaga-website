"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Link from "next/link";

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

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
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
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        gender: form.gender,
        password: form.password,
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
        <form
          onSubmit={handleRegister}
          className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-surface-elevated p-8"
        >
          <h1 className="text-xl font-semibold text-secondary">
            Create Account
          </h1>

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

          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            required
          />

          <select
            value={form.gender}
            onChange={(e) => update("gender", e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          >
            <option value="M">Male</option>
            <option value="F">Female</option>
          </select>

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
            {loading ? "Creating account..." : "Register"}
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
      </main>
    </>
  );
}
