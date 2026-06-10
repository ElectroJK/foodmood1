import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router";
import { motion, useScroll, useTransform } from "motion/react";
import {
  ArrowRight, Star, TrendingUp, Leaf, DollarSign,
  CheckCircle2, Scan, ChefHat, Users, Clock, Zap
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

// Floating app preview card component
function DashboardMockup() {
  const items = [
    { name: "Fresh Tomatoes", days: 2, color: "text-amber-500", bg: "bg-amber-50" },
    { name: "Chicken Breast", days: 1, color: "text-red-500", bg: "bg-red-50" },
    { name: "Greek Yogurt", days: 4, color: "text-[#B2D2A4]", bg: "bg-[#B2D2A4]/10" },
    { name: "Organic Milk", days: 3, color: "text-amber-500", bg: "bg-amber-50" },
  ];

  return (
    <div className="bg-white rounded-3xl shadow-[0_20px_80px_rgba(0,0,0,0.15)] overflow-hidden border border-gray-100 w-full max-w-sm">
      {/* App header */}
      <div className="bg-gradient-to-r from-[#1a2332] to-[#2d3748] p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#B2D2A4] flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-sm">FoodMood</span>
          </div>
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400 opacity-70" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 opacity-70" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400 opacity-70" />
          </div>
        </div>
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Saved", value: "127 kg", icon: TrendingUp },
            { label: "CO₂", value: "89 kg", icon: Leaf },
            { label: "Money", value: "$342", icon: DollarSign },
          ].map((s, i) => (
            <div key={i} className="bg-white/10 rounded-xl p-2.5 text-center">
              <s.icon className="w-3.5 h-3.5 text-[#B2D2A4] mx-auto mb-1" />
              <div className="text-white font-bold text-sm leading-none">{s.value}</div>
              <div className="text-white/50 text-xs mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Expiring items */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-[#4A5568] uppercase tracking-wider">Expiring Soon</span>
          <Clock className="w-3.5 h-3.5 text-amber-500" />
        </div>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className={`flex items-center justify-between px-3 py-2.5 rounded-xl ${item.bg}`}>
              <span className="text-xs font-medium text-[#4A5568]">{item.name}</span>
              <span className={`text-xs font-bold ${item.color}`}>{item.days}d</span>
            </div>
          ))}
        </div>
        <button className="w-full mt-3 py-2.5 bg-[#B2D2A4] hover:bg-[#9BC18A] rounded-xl text-[#4A5568] text-xs font-bold transition-colors flex items-center justify-center gap-1.5">
          <ChefHat className="w-3.5 h-3.5" />
          Generate Recipes
        </button>
      </div>

      {/* Bottom notification */}
      <div className="mx-4 mb-4 p-3 bg-[#1a2332]/5 rounded-xl flex items-center gap-3">
        <div className="w-7 h-7 rounded-full bg-[#B2D2A4] flex items-center justify-center flex-shrink-0">
          <Zap className="w-3.5 h-3.5 text-white" />
        </div>
        <div>
          <p className="text-xs font-semibold text-[#1a2332]">AI Suggestion</p>
          <p className="text-xs text-[#4A5568]/60">3 recipes match your pantry!</p>
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-[#4A5568]/40 ml-auto" />
      </div>
    </div>
  );
}

export function HeroSection() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [count, setCount] = useState({ users: 0, food: 0, co2: 0 });
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useEffect(() => {
    const targets = { users: 48200, food: 12750, co2: 8930 };
    const duration = 2200;
    const steps = 70;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      const progress = Math.pow(step / steps, 0.7);
      setCount({
        users: Math.floor(targets.users * progress),
        food: Math.floor(targets.food * progress),
        co2: Math.floor(targets.co2 * progress),
      });
      if (step >= steps) {
        clearInterval(interval);
        setCount(targets);
      }
    }, duration / steps);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-white pt-20"
    >
      {/* Background gradients */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full bg-[#B2D2A4]/15 blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-[#B2D2A4]/10 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] rounded-full bg-gradient-to-r from-[#B2D2A4]/8 to-transparent blur-[100px]" />
        {/* Grid pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.025]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#4A5568" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <motion.div
        style={{ y, opacity }}
        className="relative z-10 max-w-7xl mx-auto px-6 w-full py-20"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex justify-center mb-8"
        >
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#B2D2A4]/15 border border-[#B2D2A4]/30 text-sm font-medium text-[#4A5568]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#B2D2A4] animate-pulse" />
              {t("hero.trustedBy", "Trusted by")} {count.users.toLocaleString()}+ {t("hero.householdsWorldwide", "households worldwide")}
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </motion.div>

        {/* Main headline */}
        <div className="text-center mb-8 max-w-5xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-6xl md:text-7xl lg:text-8xl text-[#1a2332] leading-[1.05] tracking-tight mb-6"
            style={{ fontWeight: 800 }}
          >
            {t("hero.titleLine1", "Stop Wasting Food.")}{" "}
            <span className="relative inline-block">
              <span className="relative z-10 text-[#B2D2A4]">{t("hero.titleHighlight", "Start Saving")}</span>
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 9C60 3 160 3 297 9" stroke="#B2D2A4" strokeWidth="5" strokeLinecap="round" />
              </svg>
            </span>{" "}
            {t("hero.titleLine2", "Money & Planet.")}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="text-xl md:text-2xl text-[#4A5568]/70 max-w-3xl mx-auto leading-relaxed"
          >
            {t("hero.subtitle", "FoodMood uses AI-powered scanning, smart recipes, and community sharing to help you reduce food waste, save money, and protect the environment - all in one elegant platform.")}
          </motion.p>
        </div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <button
            onClick={() => navigate("/login")}
            className="group flex items-center gap-2 px-8 py-4 bg-[#1a2332] hover:bg-[#2d3748] text-white rounded-2xl font-semibold text-lg shadow-xl shadow-[#1a2332]/25 hover:shadow-2xl transition-all duration-300 hover:-translate-y-0.5"
          >
            {t("hero.startForFree", "Start for Free")}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 px-8 py-4 bg-white hover:bg-gray-50 text-[#4A5568] rounded-2xl font-semibold text-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300"
          >
            {t("hero.viewDemo", "View Demo")}
          </button>
        </motion.div>

        {/* Hero content: two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: stats */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <div className="grid grid-cols-1 gap-5">
              {/* Stat cards */}
              {[
                {
                  icon: TrendingUp,
                  value: `${count.food.toLocaleString()} kg`,
                  label: t("hero.foodSavedByCommunity", "Food Saved by Community"),
                  sublabel: t("hero.thisYearAlone", "This year alone"),
                  color: "from-[#B2D2A4]/20 to-[#B2D2A4]/5",
                  iconColor: "text-[#B2D2A4]",
                  iconBg: "bg-[#B2D2A4]/20",
                },
                {
                  icon: Leaf,
                  value: `${count.co2.toLocaleString()} kg`,
                  label: t("hero.co2EmissionsOffset", "CO2 Emissions Offset"),
                  sublabel: t("hero.equivalentToPlanting450Trees", "Equivalent to planting 450 trees"),
                  color: "from-green-50 to-green-50/50",
                  iconColor: "text-green-500",
                  iconBg: "bg-green-100",
                },
                {
                  icon: DollarSign,
                  value: "$34,280",
                  label: t("hero.communityMoneySaved", "Community Money Saved"),
                  sublabel: t("hero.average342PerHousehold", "Average $342 per household"),
                  color: "from-slate-50 to-slate-50/50",
                  iconColor: "text-[#4A5568]",
                  iconBg: "bg-slate-100",
                },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + i * 0.1 }}
                  className={`flex items-center gap-5 p-5 bg-gradient-to-r ${stat.color} rounded-2xl border border-white shadow-sm`}
                >
                  <div className={`w-12 h-12 rounded-2xl ${stat.iconBg} flex items-center justify-center flex-shrink-0`}>
                    <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-[#1a2332]">{stat.value}</div>
                    <div className="text-sm font-medium text-[#4A5568]">{stat.label}</div>
                    <div className="text-xs text-[#4A5568]/50 mt-0.5">{stat.sublabel}</div>
                  </div>
                </motion.div>
              ))}

              {/* Social proof */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1 }}
                className="flex items-center gap-4 pt-2"
              >
                <div className="flex -space-x-3">
                  {["#B2D2A4", "#9BC18A", "#7FB069", "#4A5568", "#2D3748"].map((color, i) => (
                    <div
                      key={i}
                      className="w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-sm"
                      style={{ backgroundColor: color }}
                    >
                      {["S", "J", "A", "M", "K"][i]}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                    <span className="text-sm font-semibold text-[#1a2332] ml-1">4.9</span>
                  </div>
                  <p className="text-xs text-[#4A5568]/60">{t("hero.fromReviews", "from 3,200+ reviews")}</p>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Right: App mockup */}
          <motion.div
            initial={{ opacity: 0, x: 40, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.9, delay: 0.7, type: "spring", stiffness: 80 }}
            className="relative flex justify-center items-center"
          >
            {/* Glow behind mockup */}
            <div className="absolute inset-0 bg-[#B2D2A4]/20 blur-[60px] rounded-full scale-75" />

            {/* Main mockup */}
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="relative z-10"
            >
              <DashboardMockup />
            </motion.div>

            {/* Floating badge 1 */}
            <motion.div
              animate={{ y: [0, -8, 0], x: [0, 4, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute -left-8 top-1/4 bg-white rounded-2xl shadow-xl border border-gray-100 p-3.5 flex items-center gap-3 z-20"
            >
              <div className="w-9 h-9 rounded-xl bg-[#B2D2A4]/20 flex items-center justify-center">
                <Scan className="w-5 h-5 text-[#B2D2A4]" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#1a2332]">{t("hero.receiptScanned", "Receipt Scanned")}</div>
                <div className="text-xs text-[#4A5568]/50">{t("hero.itemsAdded", "12 items added")}</div>
              </div>
            </motion.div>

            {/* Floating badge 2 */}
            <motion.div
              animate={{ y: [0, 8, 0], x: [0, -4, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -right-8 bottom-1/3 bg-white rounded-2xl shadow-xl border border-gray-100 p-3.5 flex items-center gap-3 z-20"
            >
              <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#1a2332]">$28 Saved</div>
                <div className="text-xs text-[#4A5568]/50">{t("hero.thisWeek", "This week")} 🎉</div>
              </div>
            </motion.div>

            {/* Floating badge 3 */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
              className="absolute -right-4 top-8 bg-[#1a2332] rounded-2xl shadow-xl p-3.5 flex items-center gap-3 z-20"
            >
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-[#B2D2A4]" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">{t("hero.itemsShared", "5 items shared")}</div>
                <div className="text-xs text-white/50">{t("hero.nearYou", "Near you")}</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-xs text-[#4A5568]/40 font-medium tracking-widest uppercase">{t("hero.scrollToExplore", "Scroll to explore")}</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-5 h-8 rounded-full border-2 border-[#4A5568]/20 flex items-center justify-center"
        >
          <div className="w-1 h-2 rounded-full bg-[#4A5568]/40" />
        </motion.div>
      </motion.div>
    </section>
  );
}
