"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import Link from "next/link";

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  gender: string;
  handicapIndex: number | null;
  handicapSource: string;
  homeClub: string | null;
  amgolfPeopleId: string | null;
}

export default function AdminPlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [search, setSearch] = useState("");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState("");
  const [fileInput, setFileInput] = useState<HTMLInputElement | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/players");
    if (res.ok) setPlayers(await res.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = players.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
      (p.homeClub?.toLowerCase().includes(q) ?? false);
    const matchesSource =
      filterSource === "all" || p.handicapSource === filterSource;
    return matchesSearch && matchesSource;
  });

  const isPlaceholderEmail = (email: string) =>
    email.endsWith("@amgolf.placeholder");

  async function handleImport() {
    if (!fileInput?.files?.[0]) {
      setImportMsg("Select a JSON file first");
      return;
    }

    setImporting(true);
    setImportMsg("Importing...");

    try {
      const text = await fileInput.files[0].text();
      const members = JSON.parse(text);

      const res = await fetch("/api/amgolf/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ members }),
      });

      const data = await res.json();
      if (res.ok) {
        setImportMsg(
          `Done: ${data.imported} imported, ${data.updated} updated, ${data.errors?.length || 0} errors`,
        );
        load();
      } else {
        setImportMsg(`Error: ${data.error}`);
      }
    } catch (err) {
      setImportMsg(
        `Error: ${err instanceof Error ? err.message : "Unknown"}`,
      );
    } finally {
      setImporting(false);
    }
  }

  const amgolfCount = players.filter((p) => p.amgolfPeopleId).length;
  const manualCount = players.filter((p) => !p.amgolfPeopleId).length;
  const withHcp = players.filter((p) => p.handicapIndex != null).length;

  return (
    <>
      <Header />
      <main id="main" className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <Link
            href="/admin"
            className="text-sm text-text-muted hover:text-secondary"
          >
            &larr; Admin Dashboard
          </Link>

          <h1 className="mt-4 text-2xl font-semibold text-secondary">
            Players
          </h1>

          {/* Stats */}
          <div className="mt-6 flex flex-wrap gap-4">
            <StatBadge label="Total" value={players.length} />
            <StatBadge label="AmGolf linked" value={amgolfCount} />
            <StatBadge label="Manual" value={manualCount} />
            <StatBadge label="With HCP" value={withHcp} />
          </div>

          {/* Import section */}
          <div className="mt-8 rounded-2xl border border-border bg-surface-elevated p-6">
            <h2 className="font-semibold text-secondary">
              Import from AmGolf
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              Upload the JSON file with AmGolf members data (tbilisi-hills-members.json)
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <input
                type="file"
                accept=".json"
                ref={(el) => setFileInput(el)}
                className="text-sm text-text-muted file:mr-4 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-primary-dark"
              />
              <button
                onClick={handleImport}
                disabled={importing}
                className="rounded-lg bg-secondary px-5 py-2.5 text-sm font-semibold text-white hover:bg-secondary/90 disabled:opacity-50"
              >
                {importing ? "Importing..." : "Import"}
              </button>
            </div>
            {importMsg && (
              <p className="mt-3 text-sm text-text-secondary">{importMsg}</p>
            )}
          </div>

          {/* Search & filter */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <input
              type="text"
              placeholder="Search by name or club..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            />
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            >
              <option value="all">All sources</option>
              <option value="amgolf">AmGolf</option>
              <option value="manual">Manual</option>
            </select>
            <span className="text-sm text-text-muted">
              Showing {filtered.length} of {players.length}
            </span>
          </div>

          {/* Players table */}
          <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-accent text-left">
                  <th className="px-4 py-3 font-medium text-text-muted">#</th>
                  <th className="px-4 py-3 font-medium text-text-muted">
                    Name
                  </th>
                  <th className="px-4 py-3 font-medium text-text-muted">
                    HCP
                  </th>
                  <th className="px-4 py-3 font-medium text-text-muted">
                    Source
                  </th>
                  <th className="px-4 py-3 font-medium text-text-muted">
                    Club
                  </th>
                  <th className="px-4 py-3 font-medium text-text-muted">
                    Gender
                  </th>
                  <th className="px-4 py-3 font-medium text-text-muted">
                    Email
                  </th>
                  <th className="px-4 py-3 font-medium text-text-muted">
                    AmGolf
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 100).map((p, i) => (
                  <tr
                    key={p.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3 text-text-muted">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-secondary">
                      {p.firstName} {p.lastName}
                    </td>
                    <td className="px-4 py-3">
                      {p.handicapIndex?.toFixed(1) ?? "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                          p.handicapSource === "amgolf"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {p.handicapSource}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-muted">
                      {p.homeClub || "-"}
                    </td>
                    <td className="px-4 py-3">{p.gender}</td>
                    <td className="px-4 py-3 text-text-muted">
                      {isPlaceholderEmail(p.email) ? (
                        <span className="text-xs italic text-text-muted/50">
                          no email
                        </span>
                      ) : (
                        p.email
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {p.amgolfPeopleId ? (
                        <span className="text-xs text-green-600">linked</span>
                      ) : (
                        <span className="text-xs text-text-muted">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length > 100 && (
              <p className="border-t border-border px-4 py-3 text-sm text-text-muted">
                Showing first 100 of {filtered.length} players. Use search to
                narrow down.
              </p>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

function StatBadge({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-surface-elevated px-4 py-3">
      <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
        {label}
      </span>
      <span className="ml-2 text-lg font-bold text-secondary">{value}</span>
    </div>
  );
}
