import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "GPAGA — Georgian Professional & Amateur Golf Association",
  description:
    "Growing the game of golf in Georgia. Tournaments, rankings, courses, and community.",
  openGraph: {
    title: "GPAGA — Georgian Professional & Amateur Golf Association",
    description:
      "Growing the game of golf in Georgia. Tournaments, rankings, courses, and community.",
    type: "website",
    images: [
      {
        url: "/images/gpaga-mark.png",
        width: 1200,
        height: 630,
        alt: "GPAGA — Georgian Professional & Amateur Golf Association",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "GPAGA — Georgian Professional & Amateur Golf Association",
    description:
      "Growing the game of golf in Georgia. Tournaments, rankings, courses, and community.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-white focus:outline-none"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
