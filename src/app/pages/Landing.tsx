import React from "react";
import { LandingNav } from "../components/landing/LandingNav";
import { HeroSection } from "../components/landing/HeroSection";
import { SocialProofBar } from "../components/landing/SocialProofBar";
import { FeaturesSection } from "../components/landing/FeaturesSection";
import { ShowcaseSection } from "../components/landing/ShowcaseSection";
import { HowItWorksSection } from "../components/landing/HowItWorksSection";
import { TestimonialsSection } from "../components/landing/TestimonialsSection";
import { PricingSection } from "../components/landing/PricingSection";
import { ImpactSection } from "../components/landing/ImpactSection";
import { FAQSection } from "../components/landing/FAQSection";
import { CTASection } from "../components/landing/CTASection";
import { FooterSection } from "../components/landing/FooterSection";

export function Landing() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      <LandingNav />
      <HeroSection />
      <SocialProofBar />
      <FeaturesSection />
      <ShowcaseSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <PricingSection />
      <ImpactSection />
      <FAQSection />
      <CTASection />
      <FooterSection />
    </div>
  );
}
