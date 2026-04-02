"use client";

import FadeIn from "./FadeIn";

const team = [
  {
    name: "Zaur Gabaidze",
    role: "Founder & President",
  },
  {
    name: "Sophie Grimley",
    role: "Operations",
  },
  {
    name: "Maka Gotsiridze-Pope",
    role: "Community",
  },
];

const roadmap = [
  { step: "Register as national federation", done: true },
  { step: "National Olympic Committee recognition", done: false },
  { step: "IGF & EGA membership", done: false },
  { step: "R&A affiliation", done: false },
  { step: "World Handicap System implementation", done: false },
];

export default function About() {
  return (
    <section className="py-24 sm:py-32" id="about">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-24">
          <FadeIn direction="up">
            <div>
              <p className="text-sm font-medium uppercase tracking-widest text-primary">
                About GPAGA
              </p>
              <h2
                className="mt-3 font-semibold text-secondary"
                style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)" }}
              >
                Building Georgia&apos;s golfing future
              </h2>
              <div className="mt-6 space-y-4 text-base leading-relaxed text-text-secondary">
                <p>
                  The Georgian Professional and Amateur Golf Association was
                  founded in 2025 with a simple mission: to grow the game of
                  golf in Georgia through organized competition, community
                  building, and international recognition.
                </p>
                <p>
                  We believe golf is more than a sport — it is a way to bring
                  people together, promote fair play, and inspire excellence.
                  Georgia&apos;s unique combination of world-class courses and
                  breathtaking landscapes makes it a natural home for the game.
                </p>
                <p>
                  Our path forward includes joining the International Golf
                  Federation (IGF), the European Golf Association (EGA), and
                  implementing the World Handicap System (WHS) — establishing
                  Georgia as a recognized golf nation.
                </p>
              </div>
            </div>
          </FadeIn>

          <div className="flex flex-col gap-12">
            <FadeIn direction="right" delay={0.1}>
              <div>
                <h3 className="text-lg font-semibold text-secondary">
                  Our Team
                </h3>
                <ul className="mt-6 space-y-4">
                  {team.map((person) => (
                    <li
                      key={person.name}
                      className="flex items-center gap-4 rounded-xl border border-border p-4"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-secondary">
                        {person.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <p className="font-medium text-secondary">
                          {person.name}
                        </p>
                        <p className="text-sm text-text-muted">{person.role}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>

            <FadeIn direction="right" delay={0.2}>
              <div>
                <h3 className="text-lg font-semibold text-secondary">
                  Road to Recognition
                </h3>
                <ol className="mt-6 space-y-3">
                  {roadmap.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          item.done
                            ? "bg-primary text-white"
                            : "border border-border text-text-muted"
                        }`}
                        {...(item.done ? { "aria-label": "Completed" } : {})}
                      >
                        {item.done ? (
                          <svg
                            aria-hidden="true"
                            className="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        ) : (
                          i + 1
                        )}
                      </span>
                      <span
                        className={`text-sm ${
                          item.done
                            ? "font-medium text-secondary"
                            : "text-text-secondary"
                        }`}
                      >
                        {item.step}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  );
}
