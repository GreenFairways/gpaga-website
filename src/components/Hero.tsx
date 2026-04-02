"use client";

import Link from "next/link";
import FadeIn from "./FadeIn";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-secondary">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.07]">
        <svg
          className="h-full w-full"
          viewBox="0 0 1440 700"
          fill="none"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <path
            d="M-100 400C100 200 400 500 700 300S1200 100 1540 350V700H-100Z"
            fill="currentColor"
            className="text-primary"
          />
          <path
            d="M-100 500C200 350 500 600 800 400S1300 250 1540 450V700H-100Z"
            fill="currentColor"
            className="text-primary"
          />
        </svg>
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-28 sm:py-36 lg:flex lg:items-center lg:gap-20 lg:px-8 lg:py-44">
        {/* Left: message */}
        <div className="max-w-2xl lg:max-w-xl">
          <FadeIn direction="up" delay={0}>
            <p className="text-sm font-medium uppercase tracking-widest text-primary">
              Georgian Professional &amp; Amateur Golf Association
            </p>
          </FadeIn>
          <FadeIn direction="up" delay={0.1}>
            <h1
              className="mt-4 font-bold leading-[1.08] text-white"
              style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)" }}
            >
              Growing the game of golf in Georgia
            </h1>
          </FadeIn>
          <FadeIn direction="up" delay={0.2}>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-secondary-light">
              Uniting players, organizing tournaments, and building a lasting
              golfing culture across three championship courses.
            </p>
          </FadeIn>
          <FadeIn direction="up" delay={0.3}>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/tournaments"
                className="inline-flex items-center rounded-lg bg-primary px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-primary-dark"
              >
                Upcoming Tournaments
              </Link>
              <Link
                href="/membership"
                className="inline-flex items-center rounded-lg border-2 border-primary/40 px-6 py-3 text-base font-semibold text-white transition-colors hover:border-primary hover:bg-primary/10"
              >
                Join GPAGA
              </Link>
            </div>
          </FadeIn>
        </div>

        {/* Right: editorial typographic accent (desktop only) */}
        <FadeIn
          direction="right"
          delay={0.3}
          className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-end"
        >
          <div className="flex items-center gap-6" aria-hidden="true">
            <div className="h-28 w-px bg-primary/30" />
            <div className="flex flex-col">
              <span className="text-xs font-medium uppercase tracking-[0.25em] text-primary">
                Inaugural season
              </span>
              <span
                className="mt-1 font-bold leading-none text-white/90"
                style={{ fontSize: "clamp(4rem, 7vw, 6rem)" }}
              >
                2026
              </span>
              <span className="mt-2 text-sm font-light tracking-wide text-secondary-light">
                Three courses &middot; Pro &amp; Amateur
              </span>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
