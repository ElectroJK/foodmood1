import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Building2, CheckCircle2, Star, Users, Zap } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

const plans = [
  {
    key: "free",
    icon: Zap,
    monthlyPrice: 0,
    yearlyPrice: 0,
    highlight: false,
    ctaStyle: "bg-gray-100 hover:bg-gray-200 text-[#1a2332]",
    features: 6,
    notIncluded: 4,
  },
  {
    key: "pro",
    icon: Star,
    monthlyPrice: 7.99,
    yearlyPrice: 5.99,
    highlight: true,
    ctaStyle: "bg-[#1a2332] hover:bg-[#2d3748] text-white shadow-xl shadow-[#1a2332]/25",
    features: 9,
    notIncluded: 0,
  },
  {
    key: "family",
    icon: Users,
    monthlyPrice: 14.99,
    yearlyPrice: 11.99,
    highlight: false,
    ctaStyle: "bg-[#B2D2A4]/20 hover:bg-[#B2D2A4]/30 text-[#4A5568] border border-[#B2D2A4]/40",
    features: 7,
    notIncluded: 0,
  },
];

export function PricingSection() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [yearly, setYearly] = useState(false);

  return (
    <section id="pricing" className="py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#B2D2A4]/15 border border-[#B2D2A4]/30 text-sm font-medium text-[#4A5568] mb-6">
            <Building2 className="w-4 h-4 text-[#B2D2A4]" />
            {t("landing.pricing.eyebrow")}
          </div>
          <h2 className="text-5xl md:text-6xl font-black text-[#1a2332] mb-6 leading-tight">
            {t("landing.pricing.titlePrefix")}{" "}
            <span className="text-[#B2D2A4]">{t("landing.pricing.titleHighlight")}</span>
          </h2>
          <p className="text-xl text-[#4A5568]/60 max-w-2xl mx-auto mb-10">
            {t("landing.pricing.subtitle")}
          </p>

          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm font-medium ${!yearly ? "text-[#1a2332]" : "text-[#4A5568]/50"}`}>
              {t("landing.pricing.monthly")}
            </span>
            <button
              onClick={() => setYearly(!yearly)}
              className={`w-12 h-6 rounded-full transition-all relative ${yearly ? "bg-[#B2D2A4]" : "bg-gray-200"}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${yearly ? "right-1" : "left-1"}`} />
            </button>
            <span className={`text-sm font-medium ${yearly ? "text-[#1a2332]" : "text-[#4A5568]/50"}`}>
              {t("landing.pricing.yearly")}
              <span className="ml-2 px-2 py-0.5 rounded-full bg-[#B2D2A4]/20 text-[#4A5568] text-xs font-bold">
                {t("landing.pricing.save")}
              </span>
            </span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.key}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: plan.highlight ? -4 : -2 }}
              className={`relative rounded-3xl p-8 transition-all duration-300 ${
                plan.highlight
                  ? "bg-[#1a2332] shadow-[0_20px_80px_rgba(26,35,50,0.25)] scale-105"
                  : "bg-white border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.06)] hover:shadow-xl"
              }`}
            >
              {plan.key === "pro" && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-[#B2D2A4] text-[#1a2332] text-xs font-bold rounded-full shadow-lg">
                  {t("landing.pricing.mostPopular")}
                </div>
              )}

              <div className="flex items-center gap-3 mb-5">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${plan.highlight ? "bg-white/15" : "bg-[#B2D2A4]/15"}`}>
                  <plan.icon className="w-5 h-5 text-[#B2D2A4]" />
                </div>
                <span className={`font-black text-lg ${plan.highlight ? "text-white" : "text-[#1a2332]"}`}>
                  {t(`landing.pricing.plans.${plan.key}.name`)}
                </span>
              </div>

              <div className="mb-4">
                <div className="flex items-end gap-1.5">
                  <span className={`text-5xl font-black ${plan.highlight ? "text-white" : "text-[#1a2332]"}`}>
                    {plan.monthlyPrice === 0 ? t("landing.pricing.freePrice") : `$${(yearly ? plan.yearlyPrice : plan.monthlyPrice).toFixed(2)}`}
                  </span>
                  {plan.monthlyPrice > 0 && (
                    <span className={`text-sm mb-2 ${plan.highlight ? "text-white/50" : "text-[#4A5568]/50"}`}>
                      {t("landing.pricing.perMonth")}
                    </span>
                  )}
                </div>
                {yearly && plan.monthlyPrice > 0 && (
                  <p className={`text-xs mt-1 ${plan.highlight ? "text-white/50" : "text-[#4A5568]/50"}`}>
                    {t("landing.pricing.billedAnnually").replace("{amount}", (plan.yearlyPrice * 12).toFixed(2))}
                  </p>
                )}
              </div>

              <p className={`text-sm leading-relaxed mb-7 ${plan.highlight ? "text-white/60" : "text-[#4A5568]/60"}`}>
                {t(`landing.pricing.plans.${plan.key}.description`)}
              </p>

              <button
                onClick={() => navigate("/login")}
                className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all mb-7 ${plan.ctaStyle}`}
              >
                {t(`landing.pricing.plans.${plan.key}.cta`)}
              </button>

              <ul className="space-y-3">
                {Array.from({ length: plan.features }).map((_, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#B2D2A4]" />
                    <span className={`text-sm ${plan.highlight ? "text-white/80" : "text-[#4A5568]"}`}>
                      {t(`landing.pricing.plans.${plan.key}.features.${i}`)}
                    </span>
                  </li>
                ))}
                {Array.from({ length: plan.notIncluded }).map((_, i) => (
                  <li key={`not-${i}`} className="flex items-start gap-3 opacity-35">
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-[#4A5568]">
                      {t(`landing.pricing.plans.${plan.key}.notIncluded.${i}`)}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-12 text-center">
          <p className="text-sm text-[#4A5568]/50">{t("landing.pricing.guarantee")}</p>
        </motion.div>
      </div>
    </section>
  );
}
