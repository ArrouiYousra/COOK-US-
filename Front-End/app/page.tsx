import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { CooksSection } from "@/components/landing/CooksSection";
import { WhyChooseUsSection } from "@/components/landing/WhyChooseUsSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { CTASection } from "@/components/landing/CTASection";
import { BecomeCookSection } from "@/components/landing/BecomeCookSection";
import { FAQSection } from "@/components/landing/FAQSection";

/**
 * Page d'accueil / Landing Page COOK US
 * Structure modulaire avec composants séparés
 */
export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <HowItWorksSection />
      <CooksSection />
      <WhyChooseUsSection />
      <TestimonialsSection />
      <CTASection />
      <BecomeCookSection />
      <FAQSection />
      <Footer />
      </main>
  );
}
