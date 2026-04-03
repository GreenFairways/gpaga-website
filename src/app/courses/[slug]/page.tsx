import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { getCourseInfo, courseInfos } from "@/data/courses/info";
import { getCourse } from "@/data/courses";
import type { Metadata } from "next";

export function generateStaticParams() {
  return courseInfos.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const info = getCourseInfo(slug);
  if (!info) return {};
  return {
    title: `${info.name} — GPAGA`,
    description: info.description,
  };
}

export default async function CoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const info = getCourseInfo(slug);
  if (!info) notFound();

  const courseData = getCourse(slug);

  return (
    <>
      <Header />
      <main id="main" className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-8 text-sm text-text-muted">
            <Link href="/courses" className="hover:text-primary">
              Courses
            </Link>
            <span className="mx-2">/</span>
            <span className="text-text-secondary">{info.shortName}</span>
          </nav>

          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="rounded-md bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary-dark">
                {info.highlight}
              </span>
              <h1
                className="mt-3 font-semibold text-secondary"
                style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)" }}
              >
                {info.name}
              </h1>
              <p className="mt-1 text-sm text-text-muted">{info.location}, {info.region}</p>
            </div>
          </div>

          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-text-secondary">
            {info.description}
          </p>

          {/* Quick stats */}
          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-4">
            {[
              { label: "Holes", value: String(info.holes) },
              { label: "Par", value: String(info.par) },
              { label: "Length", value: info.featuredLength },
              { label: "Designer", value: info.designer },
              { label: "Opened", value: String(info.yearOpened) },
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

          {/* Tee ratings */}
          {courseData && (
            <section className="mt-16">
              <h2 className="text-lg font-semibold text-secondary">
                Course Rating & Slope
              </h2>
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                      <th className="py-3 pr-4">Tee</th>
                      <th className="py-3 pr-4">Gender</th>
                      <th className="py-3 pr-4">Distance</th>
                      <th className="py-3 pr-4">Par</th>
                      <th className="py-3 pr-4">CR</th>
                      <th className="py-3 pr-4">Slope</th>
                      <th className="py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courseData.tees.map((tee, i) => (
                      <tr
                        key={`${tee.name}-${tee.gender}-${i}`}
                        className="border-b border-border/50"
                      >
                        <td className="py-3 pr-4">
                          <span className="flex items-center gap-2">
                            <span
                              className="inline-block h-3 w-3 rounded-full border border-border/50"
                              style={{ backgroundColor: tee.color }}
                            />
                            <span className="font-medium text-secondary">
                              {tee.name}
                            </span>
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-text-secondary">
                          {tee.gender === "M" ? "Men" : "Women"}
                        </td>
                        <td className="py-3 pr-4 text-text-secondary">
                          {tee.totalDistance.toLocaleString()}m
                        </td>
                        <td className="py-3 pr-4 text-text-secondary">
                          {tee.par}
                        </td>
                        <td className="py-3 pr-4 font-medium text-secondary">
                          {tee.courseRating.toFixed(1)}
                        </td>
                        <td className="py-3 pr-4 font-medium text-secondary">
                          {tee.slopeRating}
                        </td>
                        <td className="py-3">
                          {tee.ratingProvisional ? (
                            <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                              Provisional
                            </span>
                          ) : (
                            <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                              Official
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Scorecard */}
          {courseData && (
            <section className="mt-16">
              <h2 className="text-lg font-semibold text-secondary">
                Scorecard
              </h2>
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                      <th className="py-3 pr-2">Hole</th>
                      {courseData.holes.slice(0, courseData.physicalHoles).map((h) => (
                        <th key={h.number} className="min-w-[2.5rem] py-3 text-center">
                          {h.number}
                        </th>
                      ))}
                      <th className="py-3 text-center font-semibold">
                        {courseData.physicalHoles === 9 ? "Total" : "OUT"}
                      </th>
                      {courseData.physicalHoles === 18 && (
                        <>
                          {courseData.holes.slice(9, 18).map((h) => (
                            <th key={h.number} className="min-w-[2.5rem] py-3 text-center">
                              {h.number}
                            </th>
                          ))}
                          <th className="py-3 text-center font-semibold">IN</th>
                          <th className="py-3 text-center font-semibold">TOT</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Par */}
                    <tr className="border-b border-border/50 bg-accent/30">
                      <td className="py-2 pr-2 font-medium text-secondary">Par</td>
                      {courseData.physicalHoles === 18 ? (
                        <>
                          {courseData.holes.slice(0, 9).map((h) => (
                            <td key={h.number} className="py-2 text-center text-secondary">
                              {h.par}
                            </td>
                          ))}
                          <td className="py-2 text-center font-semibold text-secondary">
                            {courseData.holes.slice(0, 9).reduce((s, h) => s + h.par, 0)}
                          </td>
                          {courseData.holes.slice(9, 18).map((h) => (
                            <td key={h.number} className="py-2 text-center text-secondary">
                              {h.par}
                            </td>
                          ))}
                          <td className="py-2 text-center font-semibold text-secondary">
                            {courseData.holes.slice(9, 18).reduce((s, h) => s + h.par, 0)}
                          </td>
                          <td className="py-2 text-center font-bold text-secondary">
                            {courseData.holes.reduce((s, h) => s + h.par, 0)}
                          </td>
                        </>
                      ) : (
                        <>
                          {courseData.holes.slice(0, courseData.physicalHoles).map((h) => (
                            <td key={h.number} className="py-2 text-center text-secondary">
                              {h.par}
                            </td>
                          ))}
                          <td className="py-2 text-center font-semibold text-secondary">
                            {courseData.holes.slice(0, courseData.physicalHoles).reduce((s, h) => s + h.par, 0)}
                          </td>
                        </>
                      )}
                    </tr>

                    {/* SI */}
                    <tr className="border-b border-border/50">
                      <td className="py-2 pr-2 font-medium text-secondary">SI</td>
                      {courseData.physicalHoles === 18 ? (
                        <>
                          {courseData.holes.slice(0, 9).map((h) => (
                            <td key={h.number} className="py-2 text-center text-text-muted">
                              {h.strokeIndex}
                            </td>
                          ))}
                          <td className="py-2" />
                          {courseData.holes.slice(9, 18).map((h) => (
                            <td key={h.number} className="py-2 text-center text-text-muted">
                              {h.strokeIndex}
                            </td>
                          ))}
                          <td className="py-2" />
                          <td className="py-2" />
                        </>
                      ) : (
                        <>
                          {courseData.holes.slice(0, courseData.physicalHoles).map((h) => (
                            <td key={h.number} className="py-2 text-center text-text-muted">
                              {h.strokeIndex}
                            </td>
                          ))}
                          <td className="py-2" />
                        </>
                      )}
                    </tr>

                    {/* Distance per tee */}
                    {info.teeNames.map((teeName) => {
                      const tee = courseData.tees.find(
                        (t) => t.name === teeName && t.gender === "M",
                      ) ?? courseData.tees.find((t) => t.name === teeName);
                      if (!tee) return null;

                      return (
                        <tr key={teeName} className="border-b border-border/50">
                          <td className="py-2 pr-2">
                            <span className="flex items-center gap-1.5">
                              <span
                                className="inline-block h-2.5 w-2.5 rounded-full border border-border/50"
                                style={{ backgroundColor: tee.color }}
                              />
                              <span className="text-xs font-medium text-text-secondary">
                                {teeName}
                              </span>
                            </span>
                          </td>
                          {courseData.physicalHoles === 18 ? (
                            <>
                              {courseData.holes.slice(0, 9).map((h) => (
                                <td
                                  key={h.number}
                                  className="py-2 text-center text-xs text-text-muted"
                                >
                                  {h.distances[teeName] || "-"}
                                </td>
                              ))}
                              <td className="py-2 text-center text-xs font-medium text-text-secondary">
                                {courseData.holes
                                  .slice(0, 9)
                                  .reduce((s, h) => s + (h.distances[teeName] || 0), 0)}
                              </td>
                              {courseData.holes.slice(9, 18).map((h) => (
                                <td
                                  key={h.number}
                                  className="py-2 text-center text-xs text-text-muted"
                                >
                                  {h.distances[teeName] || "-"}
                                </td>
                              ))}
                              <td className="py-2 text-center text-xs font-medium text-text-secondary">
                                {courseData.holes
                                  .slice(9, 18)
                                  .reduce((s, h) => s + (h.distances[teeName] || 0), 0)}
                              </td>
                              <td className="py-2 text-center text-xs font-semibold text-secondary">
                                {courseData.holes.reduce(
                                  (s, h) => s + (h.distances[teeName] || 0),
                                  0,
                                )}
                              </td>
                            </>
                          ) : (
                            <>
                              {courseData.holes.slice(0, courseData.physicalHoles).map((h) => (
                                <td
                                  key={h.number}
                                  className="py-2 text-center text-xs text-text-muted"
                                >
                                  {h.distances[teeName] || "-"}
                                </td>
                              ))}
                              <td className="py-2 text-center text-xs font-semibold text-secondary">
                                {courseData.holes
                                  .slice(0, courseData.physicalHoles)
                                  .reduce((s, h) => s + (h.distances[teeName] || 0), 0)}
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {courseData.physicalHoles === 9 && (
                <p className="mt-3 text-xs text-text-muted">
                  * 9 physical holes. Played twice for an 18-hole round (par{" "}
                  {courseData.par}).
                </p>
              )}
            </section>
          )}

          {/* Two-column: Green Fees + Facilities */}
          <div className="mt-16 grid gap-8 lg:grid-cols-2">
            {/* Green Fees */}
            <section className="rounded-2xl border border-border bg-surface-elevated p-6">
              <h2 className="text-lg font-semibold text-secondary">
                Green Fees
              </h2>
              {info.greenFees && info.greenFees.rows.length > 0 ? (
                <>
                  <table className="mt-4 w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                        <th className="py-2" />
                        <th className="py-2">Mon-Fri</th>
                        <th className="py-2">Weekend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {info.greenFees.rows.map((row) => (
                        <tr
                          key={row.label}
                          className="border-b border-border/50"
                        >
                          <td className="py-2.5 font-medium text-secondary">
                            {row.label}
                          </td>
                          <td className="py-2.5 text-text-secondary">
                            {row.weekday} {info.greenFees!.currency}
                          </td>
                          <td className="py-2.5 text-text-secondary">
                            {row.weekend} {info.greenFees!.currency}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {info.greenFees.note && (
                    <p className="mt-3 text-xs text-text-muted">
                      {info.greenFees.note}
                    </p>
                  )}
                </>
              ) : (
                <p className="mt-4 text-sm text-text-muted">
                  {info.greenFees?.note ||
                    "Contact the course for current green fee rates."}
                </p>
              )}
            </section>

            {/* Facilities */}
            <section className="rounded-2xl border border-border bg-surface-elevated p-6">
              <h2 className="text-lg font-semibold text-secondary">
                Facilities
              </h2>
              <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {info.facilities.map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-2 text-sm text-text-secondary"
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {f}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Contact & Map */}
          <section className="mt-16 rounded-2xl border border-border bg-surface-elevated p-6">
            <h2 className="text-lg font-semibold text-secondary">
              Contact & Location
            </h2>
            <div className="mt-6 grid gap-8 lg:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
                    Address
                  </p>
                  <p className="mt-1 text-sm text-text-secondary">
                    {info.location}, {info.region}, Georgia
                  </p>
                </div>
                {info.phone && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
                      Phone
                    </p>
                    <a
                      href={`tel:${info.phone}`}
                      className="mt-1 text-sm text-primary hover:underline"
                    >
                      {info.phone}
                    </a>
                  </div>
                )}
                {info.email && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
                      Email
                    </p>
                    <a
                      href={`mailto:${info.email}`}
                      className="mt-1 text-sm text-primary hover:underline"
                    >
                      {info.email}
                    </a>
                  </div>
                )}
                {info.website && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
                      Website
                    </p>
                    <a
                      href={info.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 text-sm text-primary hover:underline"
                    >
                      {info.website.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                )}
              </div>

              {/* Map embed */}
              <div className="overflow-hidden rounded-xl border border-border">
                <iframe
                  title={`${info.name} location`}
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(info.name + ", Georgia")}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </section>

          {/* Back link */}
          <div className="mt-12">
            <Link
              href="/courses"
              className="text-sm font-medium text-primary hover:underline"
            >
              &larr; All courses
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
