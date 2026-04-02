"use client";

import FadeIn from "@/components/FadeIn";

interface ResultCardProps {
  scoreDifferential: number;
  adjustedGross: number;
  courseRating: number;
  slopeRating: number;
  par: number;
  isProvisional: boolean;
  ndbAdjustments: number;
  handicapIndex: number | null;
  courseHandicap: number | null;
  playingHandicap: number | null;
}

export default function ResultCard({
  scoreDifferential,
  adjustedGross,
  courseRating,
  slopeRating,
  par,
  isProvisional,
  ndbAdjustments,
  handicapIndex,
  courseHandicap,
  playingHandicap,
}: ResultCardProps) {
  return (
    <FadeIn direction="up">
      <div className="rounded-lg border border-border bg-surface-elevated">
        {/* Score Differential - hero stat */}
        <div className="border-b border-border px-6 py-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Score Differential
          </p>
          <p className="mt-1 text-5xl font-bold tabular-nums text-secondary">
            {scoreDifferential.toFixed(1)}
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-px border-b border-border bg-border sm:grid-cols-4">
          <Stat label="Adjusted Gross" value={adjustedGross.toString()} />
          <Stat
            label={
              <>
                Course Rating
                {isProvisional && (
                  <span className="ml-1 inline-block rounded bg-amber-100 px-1 py-px text-[0.6rem] font-medium text-amber-800">
                    prov.
                  </span>
                )}
              </>
            }
            value={courseRating.toFixed(1)}
          />
          <Stat
            label={
              <>
                Slope Rating
                {isProvisional && (
                  <span className="ml-1 inline-block rounded bg-amber-100 px-1 py-px text-[0.6rem] font-medium text-amber-800">
                    prov.
                  </span>
                )}
              </>
            }
            value={slopeRating.toString()}
          />
          <Stat
            label="NDB Adjustments"
            value={ndbAdjustments.toString()}
            muted={ndbAdjustments === 0}
          />
        </div>

        {/* Handicap section */}
        {handicapIndex !== null && (
          <div className="space-y-3 px-6 py-5">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                GPAGA Handicap Index
              </p>
              <p className="mt-1 text-4xl font-bold tabular-nums text-primary">
                {handicapIndex.toFixed(1)}
              </p>
            </div>
            {courseHandicap !== null && playingHandicap !== null && (
              <div className="flex justify-center gap-6 text-center">
                <div>
                  <p className="text-xs text-text-muted">Course Handicap</p>
                  <p className="text-lg font-semibold text-secondary">
                    {courseHandicap}
                  </p>
                </div>
                <div className="w-px bg-border" />
                <div>
                  <p className="text-xs text-text-muted">
                    Playing Handicap{" "}
                    <span className="text-text-muted/60">(95%)</span>
                  </p>
                  <p className="text-lg font-semibold text-secondary">
                    {playingHandicap}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {handicapIndex === null && (
          <div className="px-6 py-5 text-center text-sm text-text-muted">
            Submit at least 3 rounds to calculate your Handicap Index.
          </div>
        )}
      </div>
    </FadeIn>
  );
}

function Stat({
  label,
  value,
  muted = false,
}: {
  label: React.ReactNode;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="bg-surface-elevated px-4 py-3 text-center">
      <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-text-muted">
        {label}
      </p>
      <p
        className={`mt-0.5 text-lg font-semibold tabular-nums ${
          muted ? "text-text-muted" : "text-secondary"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
