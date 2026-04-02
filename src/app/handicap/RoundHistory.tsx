"use client";

import { useState, useRef } from "react";
import type { RoundScore } from "@/lib/handicap";
import { courses } from "@/data/courses";

interface RoundHistoryProps {
  rounds: RoundScore[];
  onDelete: (id: string) => void;
  onExport: () => void;
  onImport: (json: string) => void;
  onClear: () => void;
}

export default function RoundHistory({
  rounds,
  onDelete,
  onExport,
  onImport,
  onClear,
}: RoundHistoryProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleDelete(id: string) {
    if (confirmDeleteId === id) {
      onDelete(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
    }
  }

  function handleClear() {
    if (confirmClear) {
      onClear();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
    }
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === "string") {
        try {
          onImport(text);
        } catch {
          alert("Invalid JSON file.");
        }
      }
    };
    reader.readAsText(file);
    // Reset so the same file can be re-imported
    e.target.value = "";
  }

  const sorted = [...rounds].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onExport}
          disabled={rounds.length === 0}
          className="rounded-lg border border-secondary/30 px-3 py-1.5 text-xs font-medium text-secondary transition-colors hover:bg-secondary/5 disabled:opacity-40"
        >
          Export JSON
        </button>
        <button
          type="button"
          onClick={handleImportClick}
          className="rounded-lg border border-secondary/30 px-3 py-1.5 text-xs font-medium text-secondary transition-colors hover:bg-secondary/5"
        >
          Import JSON
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileChange}
          className="hidden"
          aria-label="Import rounds from JSON file"
        />
        {rounds.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            onBlur={() => setConfirmClear(false)}
            className={`ml-auto rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              confirmClear
                ? "border-red-300 bg-red-50 text-red-700"
                : "border-red-200 text-red-500 hover:bg-red-50"
            }`}
          >
            {confirmClear ? "Confirm Clear All" : "Clear All"}
          </button>
        )}
      </div>

      {/* Rounds list */}
      {sorted.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-muted">
          No rounds recorded yet. Enter scores above to start tracking your
          handicap.
        </p>
      ) : (
        <div className="space-y-2">
          {sorted.map((round) => {
            const course = courses[round.courseId];
            const courseName = course?.name ?? round.courseId;
            const isConfirming = confirmDeleteId === round.id;
            return (
              <div
                key={round.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-surface-elevated px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="truncate text-sm font-semibold text-secondary">
                      {courseName}
                    </span>
                    <span className="shrink-0 text-xs text-text-muted">
                      {round.teeName}
                    </span>
                    {round.isNineHole && (
                      <span className="shrink-0 rounded bg-secondary/10 px-1 py-px text-[0.6rem] font-medium text-secondary">
                        9H
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-text-muted">
                    <span>{formatDate(round.date)}</span>
                    <span>
                      Gross {round.adjustedGross} &middot; Diff{" "}
                      {round.scoreDifferential.toFixed(1)}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(round.id)}
                  onBlur={() => setConfirmDeleteId(null)}
                  className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    isConfirming
                      ? "bg-red-100 text-red-700"
                      : "text-text-muted hover:bg-red-50 hover:text-red-600"
                  }`}
                  aria-label={`Delete round from ${formatDate(round.date)}`}
                >
                  {isConfirming ? "Confirm" : "Delete"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
