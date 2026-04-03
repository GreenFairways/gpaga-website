import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { courseInfos } from "@/data/courses/info";

export default function CoursesPage() {
  const featured = courseInfos[0]; // Tbilisi Hills
  const others = courseInfos.slice(1);

  return (
    <>
      <Header />
      <main id="main" className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-widest text-primary">
              Courses
            </p>
            <h1
              className="mt-3 font-semibold text-secondary"
              style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)" }}
            >
              Golf courses in Georgia
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-text-secondary">
              From championship fairways near Tbilisi to wine country greens in
              Kakheti. Three venues, each with its own character.
            </p>
          </div>

          {/* Featured course */}
          <Link href={`/courses/${featured.slug}`} className="block">
            <article className="mt-12 group rounded-2xl border border-border bg-surface-elevated transition-transform hover:-translate-y-1">
              <div className="flex items-center justify-between border-b border-border px-8 py-5">
                <div className="flex items-center gap-4">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-base font-bold text-white">
                    {featured.holes}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-secondary">
                      Championship Course
                    </p>
                    <p className="text-xs text-text-muted">
                      {featured.holes} holes &middot; Par {featured.par} &middot;{" "}
                      {featured.featuredLength}
                    </p>
                  </div>
                </div>
                <span className="hidden rounded-md bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary-dark sm:inline-block">
                  {featured.highlight}
                </span>
              </div>

              <div className="px-8 py-8">
                <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
                  {featured.region}
                </p>
                <h2
                  className="mt-2 font-semibold text-secondary"
                  style={{ fontSize: "clamp(1.25rem, 2.5vw, 1.75rem)" }}
                >
                  {featured.name}
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-text-secondary">
                  {featured.description}
                </p>

                <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
                  {[
                    { label: "Holes", value: String(featured.holes) },
                    { label: "Par", value: String(featured.par) },
                    { label: "Length", value: featured.featuredLength },
                    { label: "Designer", value: featured.designer },
                    { label: "Opened", value: String(featured.yearOpened) },
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
            </article>
          </Link>

          {/* Other courses */}
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {others.map((course) => (
              <Link
                key={course.slug}
                href={`/courses/${course.slug}`}
                className="block"
              >
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
                    {course.region}
                  </p>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-text-secondary">
                    {course.description}
                  </p>

                  <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                    <span className="rounded-md bg-secondary/10 px-2.5 py-1 text-xs font-medium text-secondary">
                      {course.highlight}
                    </span>
                    <span className="text-xs font-medium text-text-muted">
                      {course.featuredLength}
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
