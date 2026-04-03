import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { sql } from "@/lib/db";
import { mapTournament } from "@/lib/db/mappers";
import Link from "next/link";

const STATUS_LABELS: Record<string, { text: string; className: string }> = {
  draft: { text: "Coming Soon", className: "bg-secondary/10 text-secondary" },
  registration_open: {
    text: "Registration Open",
    className: "bg-primary/10 text-primary-dark",
  },
  registration_closed: {
    text: "Registration Closed",
    className: "bg-amber-100 text-amber-800",
  },
  in_progress: {
    text: "In Progress",
    className: "bg-emerald-100 text-emerald-800",
  },
  completed: { text: "Completed", className: "bg-gray-100 text-gray-600" },
};

const FORMAT_LABELS: Record<string, string> = {
  strokeplay: "Strokeplay",
  stableford: "Stableford",
  matchplay: "Match Play",
};

export const dynamic = "force-dynamic";

export default async function TournamentsPage() {
  let tournaments: ReturnType<typeof mapTournament>[] = [];
  try {
    const { rows } = await sql`
      SELECT * FROM tournaments ORDER BY date DESC
    `;
    tournaments = rows.map(mapTournament);
  } catch {
    // DB not initialized yet — show empty
  }

  const upcoming = tournaments.filter(
    (t) => t.status !== "completed",
  );
  const completed = tournaments.filter((t) => t.status === "completed");

  return (
    <>
      <Header />
      <main id="main" className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-widest text-primary">
              Tournaments
            </p>
            <h1
              className="mt-3 font-semibold text-secondary"
              style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)" }}
            >
              2026 Season
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-text-secondary">
              Competitive golf across three venues in Georgia. Open to
              professionals and amateurs.
            </p>
          </div>

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <section className="mt-12">
              <h2 className="text-lg font-semibold text-secondary">
                Upcoming & Active
              </h2>
              <div className="mt-6 space-y-4">
                {upcoming.map((t, i) => (
                  <TournamentCard key={t.id} tournament={t} index={i} />
                ))}
              </div>
            </section>
          )}

          {/* Completed */}
          {completed.length > 0 && (
            <section className="mt-16">
              <h2 className="text-lg font-semibold text-secondary">
                Completed
              </h2>
              <div className="mt-6 space-y-4">
                {completed.map((t, i) => (
                  <TournamentCard key={t.id} tournament={t} index={i} />
                ))}
              </div>
            </section>
          )}

          {tournaments.length === 0 && (
            <p className="mt-12 text-text-muted">
              No tournaments scheduled yet. Check back soon.
            </p>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function TournamentCard({
  tournament: t,
  index,
}: {
  tournament: ReturnType<typeof mapTournament>;
  index: number;
}) {
  const status = STATUS_LABELS[t.status] || STATUS_LABELS.draft;
  const format = FORMAT_LABELS[t.format] || t.format;

  return (
    <Link href={`/tournaments/${t.id}`}>
      <article className="group flex flex-col gap-4 rounded-2xl border border-border bg-surface-elevated p-6 transition-colors hover:border-primary/30 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4 sm:items-center">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent text-lg font-bold text-secondary">
            {index + 1}
          </div>
          <div>
            <h3 className="font-semibold text-secondary">{t.name}</h3>
            <p className="mt-1 text-sm text-text-muted">
              {format} &middot; {t.maxPlayers} max players
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 sm:shrink-0">
          <time className="text-sm font-medium text-text-secondary">
            {new Date(t.date + "T00:00:00").toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </time>
          <span
            className={`rounded-md px-3 py-1 text-xs font-medium ${status.className}`}
          >
            {status.text}
          </span>
        </div>
      </article>
    </Link>
  );
}
