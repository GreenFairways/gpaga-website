import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Tournaments from "@/components/Tournaments";
import Courses from "@/components/Courses";
import About from "@/components/About";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main id="main">
        <Hero />
        <Tournaments />
        <Courses />
        <About />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
