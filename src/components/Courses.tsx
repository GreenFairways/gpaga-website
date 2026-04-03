"use client";

import FadeIn from "./FadeIn";
import Link from "next/link";

const featured = {
  name: "Tbilisi Hills Golf Club",
  holes: 18,
  par: 72,
  location: "Tbilisi",
  description:
    "Georgia's premier 18-hole championship course designed by Lassi Tillander. A European Tour Destination set against the Caucasus mountains.",
  highlight: "European Tour Destination",
  length: "6,409m",
};

const secondary = [
  {
    slug: "tabori-paragraph",
    name: "Tabori Paragraph",
    holes: 9,
    par: 36,
    location: "Tbilisi Region",
    description:
      "A dramatic 9-hole course on Mount Tabori designed by Kevin Ramsey, accessible by cable car from central Tbilisi. Part of the Marriott Autograph Collection resort.",
    highlight: "Marriott Autograph Collection",
    length: "2,973m",
  },
  {
    slug: "ambassadori-kachreti",
    name: "Ambassadori Kachreti",
    holes: 9,
    par: 36,
    location: "Kakheti",
    description:
      "Nestled in Georgia's famous wine region, this 9-hole course offers a unique combination of golf and Georgian hospitality at a 5-star resort.",
    highlight: "Wine Country Golf",
    length: "2,796m",
  },
];

export default function Courses() {
  return (
    <section className="bg-surface py-24 sm:py-32" id="courses">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <FadeIn direction="up">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-widest text-primary">
              Courses
            </p>
            <h2
              className="mt-3 font-semibold text-secondary"
              style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)" }}
            >
              Three courses across Georgia
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-text-secondary">
              From championship fairways near Tbilisi to wine country greens in
              Kakheti, Georgian golf has a course for every player.
            </p>
          </div>
        </FadeIn>

        {/* Asymmetric layout: hero left, two stacked right */}
        <div className="mt-16 grid gap-6 lg:grid-cols-5">
          {/* Featured course — spans 3 of 5 columns */}
          <FadeIn direction="up" delay={0} className="lg:col-span-3">
            <Link href="/courses/tbilisi-hills">
            <article className="group flex h-full flex-col rounded-2xl border border-border bg-surface-elevated transition-transform hover:-translate-y-1">
              {/* Top band with course stats */}
              <div className="flex items-center justify-between border-b border-border px-8 py-5">
                <div className="flex items-center gap-4">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-base font-bold text-white">
                    18
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-secondary">
                      Championship Course
                    </p>
                    <p className="text-xs text-text-muted">
                      {featured.holes} holes &middot; Par {featured.par} &middot;{" "}
                      {featured.length}
                    </p>
                  </div>
                </div>
                <span className="hidden rounded-md bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary-dark sm:inline-block">
                  {featured.highlight}
                </span>
              </div>

              {/* Body */}
              <div className="flex flex-1 flex-col justify-between px-8 py-8">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
                    {featured.location}
                  </p>
                  <h3
                    className="mt-2 font-semibold text-secondary"
                    style={{ fontSize: "clamp(1.25rem, 2.5vw, 1.75rem)" }}
                  >
                    {featured.name}
                  </h3>
                  <p className="mt-4 max-w-lg text-base leading-relaxed text-text-secondary">
                    {featured.description}
                  </p>
                </div>

                {/* Course attributes row */}
                <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
                  {[
                    { label: "Holes", value: "18" },
                    { label: "Par", value: "72" },
                    { label: "Length", value: "6,409m" },
                    { label: "Designer", value: "Lassi Tillander" },
                  ].map((stat) => (
                    <div key={stat.label}>
                      <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
                        {stat.label}
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-secondary">
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile-only badge */}
              <div className="border-t border-border px-8 py-4 sm:hidden">
                <span className="rounded-md bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary-dark">
                  {featured.highlight}
                </span>
              </div>
            </article>
            </Link>
          </FadeIn>

          {/* Secondary courses — stacked in 2 of 5 columns */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            {secondary.map((course, i) => (
              <FadeIn
                key={course.name}
                direction="right"
                delay={0.12 + i * 0.12}
              >
                <Link href={`/courses/${course.slug}`}>
                <article className="group flex h-full flex-col rounded-2xl border border-border bg-surface-elevated p-6 transition-colors hover:border-primary/30">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-sm font-bold text-secondary">
                      {course.holes}
                    </span>
                    <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
                      {course.holes} holes &middot; Par {course.par}
                    </p>
                  </div>

                  <h3 className="mt-4 text-lg font-semibold text-secondary">
                    {course.name}
                  </h3>
                  <p className="mt-1 text-xs text-text-muted">
                    {course.location}
                  </p>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-text-secondary">
                    {course.description}
                  </p>

                  <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                    <span className="rounded-md bg-secondary/10 px-2.5 py-1 text-xs font-medium text-secondary">
                      {course.highlight}
                    </span>
                    <span className="text-xs font-medium text-text-muted">
                      {course.length}
                    </span>
                  </div>
                </article>
                </Link>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
