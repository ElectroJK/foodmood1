import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowRight, ChefHat, Leaf, Scan, Users } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

const FOOD_IMG = "https://images.unsplash.com/photo-1567137827022-fbe18eff7275?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";

const steps = [
  { icon: Scan, key: "scan" },
  { icon: ChefHat, key: "cook" },
  { icon: Users, key: "share" },
  { icon: Leaf, key: "track" },
];

export function CTASection() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <section className="py-32 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-[40px] overflow-hidden"
        >
          <div className="absolute inset-0">
            <img src={FOOD_IMG} alt={t("landing.cta.imageAlt")} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#1a2332]/97 via-[#1a2332]/90 to-[#1a2332]/70" />
          </div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center p-12 md:p-16 lg:p-20">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-xl bg-[#B2D2A4] flex items-center justify-center">
                  <Leaf className="w-4 h-4 text-white" />
                </div>
                <span className="text-[#B2D2A4] font-semibold text-sm">{t("landing.cta.eyebrow")}</span>
              </div>

              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
                {t("landing.cta.title")}
              </h2>
              <p className="text-white/60 text-lg leading-relaxed mb-10">{t("landing.cta.subtitle")}</p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate("/login")}
                  className="group flex items-center justify-center gap-2.5 px-8 py-4 bg-[#B2D2A4] hover:bg-[#9BC18A] text-[#1a2332] rounded-2xl font-bold text-lg transition-all shadow-xl shadow-[#B2D2A4]/30 hover:shadow-2xl hover:-translate-y-0.5"
                >
                  {t("landing.cta.primary")}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-semibold text-lg border border-white/20 transition-all"
                >
                  {t("landing.cta.secondary")}
                </button>
              </div>

              <p className="text-white/30 text-sm mt-5">{t("landing.cta.note")}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {steps.map((step, i) => (
                <motion.div
                  key={step.key}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + i * 0.1 }}
                  className="bg-white/8 hover:bg-white/15 border border-white/10 rounded-3xl p-7 transition-all duration-300 group cursor-pointer"
                  onClick={() => navigate("/login")}
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#B2D2A4]/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <step.icon className="w-6 h-6 text-[#B2D2A4]" />
                  </div>
                  <p className="text-white font-semibold">{t(`landing.cta.steps.${step.key}`)}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
