"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/tournaments", label: "Tournaments" },
  { href: "/courses", label: "Courses" },
  { href: "/rankings", label: "Rankings" },
  { href: "/handicap", label: "Handicap" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [playerName, setPlayerName] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.firstName) setPlayerName(data.firstName);
      })
      .catch(() => {});
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface-elevated/80 backdrop-blur-md">
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/images/gpaga-mark-80.png"
            alt=""
            width={40}
            height={40}
            className="h-10 w-10"
            priority
          />
          <div className="inline-grid">
            <span className="text-[1.75rem] font-bold leading-none tracking-[-0.02em] text-secondary">
              GPAGA
            </span>
            <span className="mt-[3px] overflow-hidden text-center text-[0.3rem] font-bold uppercase leading-[1.4] tracking-[0.1em] text-secondary">
              Georgian Professional &amp; Amateur
              <br />
              Golf Association
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-accent hover:text-secondary"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* CTA */}
        {playerName ? (
          <Link
            href="/player"
            className="hidden rounded-lg border border-primary px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white md:inline-flex"
          >
            Dashboard
          </Link>
        ) : (
          <Link
            href="/player/login"
            className="hidden rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark md:inline-flex"
          >
            Log In
          </Link>
        )}

        {/* Mobile toggle */}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg p-2 text-text-secondary md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-expanded={mobileOpen}
          aria-label="Toggle navigation menu"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            aria-hidden="true"
          >
            {mobileOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border md:hidden">
          <ul className="space-y-1 px-6 py-4">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block rounded-lg px-3 py-2 text-base font-medium text-text-secondary transition-colors hover:bg-accent hover:text-secondary"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              {playerName ? (
                <Link
                  href="/player"
                  className="mt-2 block rounded-lg border border-primary px-3 py-2.5 text-center text-base font-semibold text-primary"
                  onClick={() => setMobileOpen(false)}
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  href="/player/login"
                  className="mt-2 block rounded-lg bg-primary px-3 py-2.5 text-center text-base font-semibold text-white"
                  onClick={() => setMobileOpen(false)}
                >
                  Log In
                </Link>
              )}
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
