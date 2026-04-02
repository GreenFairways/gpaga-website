import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HandicapCalculator from "./HandicapCalculator";

export const metadata: Metadata = {
  title: "GPAGA Handicap Calculator",
  description:
    "Calculate your World Handicap System index on Georgian golf courses. Track rounds at Tbilisi Hills and Tabori Paragraph.",
};

export default function HandicapPage() {
  return (
    <>
      <Header />
      <main id="main" className="flex-1">
        <HandicapCalculator />
      </main>
      <Footer />
    </>
  );
}
