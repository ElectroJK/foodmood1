import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { DollarSign, Globe2, Heart, Leaf, TrendingUp, Users } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

const ECO_IMG = "https://images.unsplash.com/photo-1583907659441-addbe699e921?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";

const impactStats = [
  { icon: TrendingUp, value: "12,750", unit: "kg", key: "foodSaved", color: "#B2D2A4" },
  { icon: Leaf, value: "8,930", unit: "kg", key: "co2Offset", color: "#10b981" },
  { icon: DollarSign, value: "2.1M", unit: "+", key: "communitySavings", color: "#4A5568" },
  { icon: Users, value: "48,200", unit: "+", key: "activeMembers", color: "#3b82f6" },
  { icon: Globe2, value: "50+", unit: "", key: "countries", color: "#f59e0b" },
  { icon: Heart, value: "1.2M", unit: "+", key: "itemsShared", color: "#ec4899" },
];

export function ImpactSection() {
  const ref = useRef(null);
  const { t } = useLanguage();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);

  return (
    <section ref={ref} className="relative py-32 overflow-hidden" id="community">
      <motion.div className="absolute inset-0 z-0" style={{ y: bgY }}>
        <img src={ECO_IMG} alt={t("landing.impact.imageAlt")} className="w-full h-[120%] object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a2332]/92 via-[#1a2332]/88 to-[#1a2332]/95" />
      </motion.div>

      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#B2D2A4]/40 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#B2D2A4]/20 border border-[#B2D2A4]/30 text-sm font-medium text-[#B2D2A4] mb-6">
            <Globe2 className="w-4 h-4" />
            {t("landing.impact.eyebrow")}
          </div>
          <h2 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
            {t("landing.impact.titlePrefix")}{" "}
            <span className="text-[#B2D2A4]">{t("landing.impact.titleHighlight")}</span>
          </h2>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">{t("landing.impact.subtitle")}</p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-5 mb-20">
          {impactStats.map((stat, index) => (
            <motion.div
              key={stat.key}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              whileHover={{ scale: 1.03 }}
              className="bg-white/8 backdrop-blur-sm border border-white/10 rounded-3xl p-7 hover:bg-white/12 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{ backgroundColor: stat.color + "25" }}>
                <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
              </div>
              <div className="flex items-end gap-1 mb-2">
                <span className="text-4xl font-black text-white">{stat.value}</span>
                <span className="text-xl font-black mb-1" style={{ color: stat.color }}>{stat.unit}</span>
              </div>
              <div className="font-semibold text-white/90 mb-1">{t(`landing.impact.stats.${stat.key}.label`)}</div>
              <div className="text-sm text-white/40">{t(`landing.impact.stats.${stat.key}.sublabel`)}</div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-[#B2D2A4]/20 to-[#B2D2A4]/10 border border-[#B2D2A4]/30 rounded-3xl p-10 text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex -space-x-2">
              {["#B2D2A4", "#9BC18A", "#7FB069", "#4A5568"].map((color, i) => (
                <div key={color} className="w-9 h-9 rounded-full border-2 border-[#B2D2A4]/20 flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: color }}>
                  {["S", "J", "A", "M"][i]}
                </div>
              ))}
            </div>
            <span className="text-white/80 text-sm font-medium">{t("landing.impact.join")}</span>
          </div>
          <h3 className="text-2xl font-black text-white mb-3">{t("landing.impact.bannerTitle")}</h3>
          <p className="text-white/50 mb-6 max-w-md mx-auto">{t("landing.impact.bannerText")}</p>
          <a href="/login" className="inline-flex items-center gap-2 px-8 py-4 bg-[#B2D2A4] hover:bg-[#9BC18A] text-[#1a2332] rounded-2xl font-bold transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5">
            {t("landing.impact.cta")}
          </a>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#B2D2A4]/30 to-transparent" />
    </section>
  );
}
