"use client";

import FadeIn from "./FadeIn";

const upcomingTournaments = [
  {
    name: "GPAGA Season Opener 2026",
    date: "May 2026",
    course: "Tbilisi Hills Golf Club",
    format: "Strokeplay, 18 holes",
    status: "Registration Opening Soon",
    statusColor: "bg-primary/10 text-primary-dark",
  },
  {
    name: "Kakheti Wine & Golf Cup",
    date: "June 2026",
    course: "Ambassadori Kachreti",
    format: "Stableford, 18 holes (9x2)",
    status: "Coming Soon",
    statusColor: "bg-secondary/10 text-secondary",
  },
  {
    name: "Tbilisi Hills Championship",
    date: "September 2026",
    course: "Tbilisi Hills Golf Club",
    format: "Strokeplay, 36 holes",
    status: "Coming Soon",
    statusColor: "bg-secondary/10 text-secondary",
  },
];

export default function Tournaments() {
  return (
    <section className="py-24 sm:py-32" id="tournaments">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <FadeIn direction="up">
            <div className="max-w-2xl">
              <p className="text-sm font-medium uppercase tracking-widest text-primary">
                Tournaments
              </p>
              <h2
                className="mt-3 font-semibold text-secondary"
                style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)" }}
              >
                2026 Season
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-text-secondary">
                Our inaugural season brings competitive golf to three venues
                across Georgia. Open to professionals and amateurs alike.
              </p>
            </div>
          </FadeIn>
          <FadeIn direction="left" delay={0.1}>
            <a
              href="/tournaments"
              className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-secondary transition-colors hover:bg-accent"
            >
              View all tournaments
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </a>
          </FadeIn>
        </div>

        <div className="mt-12 space-y-4">
          {upcomingTournaments.map((t, i) => (
            <FadeIn key={t.name} direction="up" delay={i * 0.1}>
              <article className="group flex flex-col gap-4 rounded-2xl border border-border bg-surface-elevated p-6 transition-colors hover:border-primary/30 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4 sm:items-center">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent text-lg font-bold text-secondary">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold text-secondary">{t.name}</h3>
                    <p className="mt-1 text-sm text-text-muted">
                      {t.course} &middot; {t.format}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 sm:shrink-0">
                  <time className="text-sm font-medium text-text-secondary">
                    {t.date}
                  </time>
                  <span
                    className={`rounded-md px-3 py-1 text-xs font-medium ${t.statusColor}`}
                  >
                    {t.status}
                  </span>
                </div>
              </article>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
