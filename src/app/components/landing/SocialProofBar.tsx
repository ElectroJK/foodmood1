import { motion } from "motion/react";
import { Leaf } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

const brands = [
  { name: "EcoLife", color: "#B2D2A4" },
  { name: "GreenTable", color: "#7FB069" },
  { name: "WasteLess", color: "#4A5568" },
  { name: "FreshFirst", color: "#B2D2A4" },
  { name: "ZeroWaste", color: "#2D3748" },
  { name: "EcoKitchen", color: "#7FB069" },
  { name: "PlanetFood", color: "#4A5568" },
  { name: "GreenMeal", color: "#B2D2A4" },
];

export function SocialProofBar() {
  const { t } = useLanguage();
  const stats = [
    { value: "48,200+", labelKey: "activeUsers" },
    { value: "12.7 tons", labelKey: "foodSaved" },
    { value: "$2.1M+", labelKey: "communitySavings" },
    { value: "4.9 / 5.0", labelKey: "averageRating" },
  ];

  return (
    <section className="py-16 border-y border-gray-100 bg-gray-50/60 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-10 text-center">
        <p className="text-sm font-semibold text-[#4A5568]/50 uppercase tracking-widest">
          {t("landing.socialProof.trusted")}
        </p>
      </div>

      {/* Infinite marquee */}
      <div className="relative">
        <div className="flex overflow-hidden gap-0">
          {[0, 1].map((set) => (
            <motion.div
              key={set}
              className="flex gap-12 items-center flex-shrink-0"
              animate={{ x: ["0%", "-100%"] }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: "linear",
                delay: set * 0,
              }}
            >
              {brands.map((brand, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 px-8 py-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow whitespace-nowrap"
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${brand.color}20` }}
                  >
                    <Leaf className="w-4 h-4" style={{ color: brand.color }} />
                  </div>
                  <span className="font-semibold text-[#4A5568] text-sm">{brand.name}</span>
                </div>
              ))}
            </motion.div>
          ))}
        </div>
        {/* Fade edges */}
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-gray-50 to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none" />
      </div>

      {/* Key numbers */}
      <div className="max-w-5xl mx-auto px-6 mt-14 grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="text-center"
          >
            <div className="text-3xl font-black text-[#1a2332] mb-1">{stat.value}</div>
            <div className="text-sm text-[#4A5568]/60 font-medium">{t(`landing.socialProof.stats.${stat.labelKey}`)}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
