import Link from "next/link";
import Image from "next/image";

const footerLinks = {
  Association: [
    { label: "About", href: "/about" },
    { label: "Membership", href: "/membership" },
    { label: "Contact", href: "/contact" },
  ],
  Golf: [
    { label: "Tournaments", href: "/tournaments" },
    { label: "Rankings", href: "/rankings" },
    { label: "Courses", href: "/courses" },
  ],
  Courses: [
    { label: "Tbilisi Hills", href: "/courses/tbilisi-hills" },
    { label: "Tabori Paragraph", href: "/courses/tabori-paragraph" },
    { label: "Ambassadori Kachreti", href: "/courses/ambassadori-kachreti" },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface" role="contentinfo">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand block */}
          <div>
            <div className="flex items-center gap-2">
              <Image
                src="/images/gpaga-mark-80.png"
                alt=""
                width={32}
                height={32}
                className="h-8 w-8"
              />
              <div className="inline-grid">
                <span className="text-[1.4rem] font-bold leading-none tracking-[-0.02em] text-secondary">
                  GPAGA
                </span>
                <span className="mt-[2px] hidden overflow-hidden text-center text-[0.24rem] font-bold uppercase leading-[1.4] tracking-[0.1em] text-secondary/70 sm:inline">
                  Georgian Professional &amp; Amateur
                  <br />
                  Golf Association
                </span>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-text-muted">
              Georgian Professional &amp; Amateur Golf Association. Growing the
              game of golf in Georgia since 2025.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-secondary">
                {title}
              </h3>
              <ul className="mt-4 space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-text-muted transition-colors hover:text-secondary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="text-xs text-text-muted">
            &copy; {new Date().getFullYear()} GPAGA. All rights reserved.
          </p>
          <p className="text-xs text-text-muted">
            Technology Partner:{" "}
            <a
              href="https://vailis.ai"
              className="font-medium text-primary transition-colors hover:text-primary-dark"
              target="_blank"
              rel="noopener noreferrer"
            >
              Vailis.ai<span className="sr-only"> (opens in new tab)</span>
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
