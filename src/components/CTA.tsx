"use client";

import Link from "next/link";
import FadeIn from "./FadeIn";

export default function CTA() {
  return (
    <section className="bg-secondary py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <FadeIn direction="up" className="mx-auto max-w-2xl text-center">
          <h2
            className="font-bold text-white"
            style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)" }}
          >
            Ready to play?
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-secondary-light">
            Whether you&apos;re a seasoned pro or picking up a club for the
            first time, GPAGA welcomes you. Join us and be part of
            Georgia&apos;s golfing history.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/membership"
              className="inline-flex items-center rounded-lg bg-primary px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-primary-dark"
            >
              Become a Member
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center rounded-lg border-2 border-white/20 px-6 py-3 text-base font-semibold text-white transition-colors hover:border-white/40 hover:bg-white/5"
            >
              Get in Touch
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
