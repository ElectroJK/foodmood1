import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Leaf, Menu, X } from "lucide-react";
import { supportedLanguages, useLanguage } from "../../context/LanguageContext";

export function LandingNav() {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: t("pages.landing.features"), href: "#features" },
    { label: t("pages.landing.howItWorks"), href: "#how-it-works" },
    { label: t("pages.landing.community"), href: "#community" },
    { label: t("pages.landing.pricing"), href: "#pricing" },
    { label: t("pages.landing.faq"), href: "#faq" },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-xl shadow-[0_1px_30px_rgba(0,0,0,0.08)] border-b border-gray-100"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between py-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#B2D2A4] to-[#7FB069] flex items-center justify-center shadow-lg shadow-[#B2D2A4]/30">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-[#1a2332] tracking-tight">FoodMood</span>
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-4 py-2 rounded-xl text-[#4A5568] hover:text-[#1a2332] hover:bg-gray-50 transition-all text-sm font-medium"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Language + CTA buttons */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center rounded-xl border border-gray-200 p-1">
              {supportedLanguages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors uppercase ${
                    language === lang
                      ? "bg-[#1a2332] text-white"
                      : "text-[#4A5568] hover:bg-gray-100"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
            <button
              onClick={() => navigate("/login")}
              className="px-5 py-2.5 rounded-xl text-[#4A5568] hover:text-[#1a2332] hover:bg-gray-100 transition-all text-sm font-semibold"
            >
              {t("pages.landing.signIn")}
            </button>
            <button
              onClick={() => navigate("/login")}
              className="px-5 py-2.5 rounded-xl bg-[#1a2332] hover:bg-[#2d3748] text-white text-sm font-semibold transition-all shadow-lg shadow-[#1a2332]/20 hover:shadow-xl"
            >
              {t("pages.landing.getStartedFree")}
            </button>
          </div>

          {/* Mobile menu */}
          <button
            className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5 text-[#4A5568]" /> : <Menu className="w-5 h-5 text-[#4A5568]" />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-[70px] left-4 right-4 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4"
          >
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="flex items-center px-4 py-3 rounded-xl text-[#4A5568] hover:bg-gray-50 hover:text-[#1a2332] transition-all text-sm font-medium"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="border-t border-gray-100 mt-3 pt-3">
              <div className="flex items-center justify-center gap-2">
                {supportedLanguages.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg uppercase transition-colors ${
                      language === lang
                        ? "bg-[#1a2332] text-white"
                        : "bg-gray-100 text-[#4A5568]"
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-gray-100 mt-3 pt-3 flex flex-col gap-2">
              <button
                onClick={() => { navigate("/login"); setMobileOpen(false); }}
                className="w-full py-3 rounded-xl text-[#4A5568] hover:bg-gray-50 text-sm font-semibold transition-all"
              >
                {t("pages.landing.signIn")}
              </button>
              <button
                onClick={() => { navigate("/login"); setMobileOpen(false); }}
                className="w-full py-3 rounded-xl bg-[#1a2332] text-white text-sm font-semibold transition-all"
              >
                {t("pages.landing.getStartedFree")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
