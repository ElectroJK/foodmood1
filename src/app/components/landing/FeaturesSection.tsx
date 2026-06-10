import { motion } from "motion/react";
import {
  Scan, ChefHat, Users, Bell, BarChart2, ShieldCheck,
  Zap, Globe, Smartphone, Star, ArrowRight
} from "lucide-react";
import { useNavigate } from "react-router";
import { useLanguage } from "../../context/LanguageContext";

const features = [
  {
    icon: Scan,
    title: "Smart OCR Scanner",
    description: "Instantly scan grocery receipts with AI. Automatically add items with correct quantities, prices, and intelligent expiry predictions.",
    badge: "AI-Powered",
    color: "from-[#B2D2A4]/20 to-[#B2D2A4]/5",
    iconColor: "text-[#B2D2A4]",
    iconBg: "bg-[#B2D2A4]/15",
    path: "/scanner",
  },
  {
    icon: ChefHat,
    title: "Expiry-Smart Recipes",
    description: "Get AI-curated recipe suggestions based on what's about to expire. Say goodbye to forgotten food and hello to delicious meals.",
    badge: "Smart",
    color: "from-amber-50 to-amber-50/30",
    iconColor: "text-amber-500",
    iconBg: "bg-amber-50",
    path: "/recipes",
  },
  {
    icon: Users,
    title: "Community Marketplace",
    description: "Share surplus food with neighbors, request items you need. Building a sustainable, zero-waste community one exchange at a time.",
    badge: "Community",
    color: "from-blue-50 to-blue-50/30",
    iconColor: "text-blue-500",
    iconBg: "bg-blue-50",
    path: "/community",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description: "Receive timely alerts before food expires. Never waste another item again with our intelligent, personalized reminder system.",
    badge: "Proactive",
    color: "from-purple-50 to-purple-50/30",
    iconColor: "text-purple-500",
    iconBg: "bg-purple-50",
    path: "/notifications",
  },
  {
    icon: BarChart2,
    title: "Impact Analytics",
    description: "Track your sustainability journey with detailed dashboards showing money saved, CO₂ offset, and your contribution to the planet.",
    badge: "Data-Driven",
    color: "from-slate-50 to-slate-50/30",
    iconColor: "text-[#4A5568]",
    iconBg: "bg-slate-100",
    path: "/analytics",
  },
  {
    icon: Globe,
    title: "Global Community Impact",
    description: "See your collective contribution with real-time community metrics. Together, we've saved thousands of kg of food worldwide.",
    badge: "Global",
    color: "from-teal-50 to-teal-50/30",
    iconColor: "text-teal-500",
    iconBg: "bg-teal-50",
    path: "/community",
  },
];

const highlights = [
  { icon: Zap, text: "Setup in under 2 minutes" },
  { icon: ShieldCheck, text: "Privacy-first, your data is yours" },
  { icon: Smartphone, text: "Works on all devices" },
  { icon: Star, text: "4.9/5 from 3,200+ users" },
];

export function FeaturesSection() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <section id="features" className="py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#B2D2A4]/15 border border-[#B2D2A4]/30 text-sm font-medium text-[#4A5568] mb-6">
            <Zap className="w-4 h-4 text-[#B2D2A4]" />
            {t("landing.features.eyebrow", "Everything in one platform")}
          </div>
          <h2 className="text-5xl md:text-6xl font-black text-[#1a2332] mb-6 leading-tight">
            {t("landing.features.titlePrefix", "Powerful features for")}{" "}
            <span className="text-[#B2D2A4]">{t("landing.features.titleHighlight", "smarter")}</span> {t("landing.features.titleSuffix", "eating")}
          </h2>
          <p className="text-xl text-[#4A5568]/60 max-w-2xl mx-auto leading-relaxed">
            {t("landing.features.subtitle", "From AI-powered scanning to community sharing, FoodMood gives you every tool to eliminate food waste and live more sustainably.")}
          </p>
        </motion.div>

        {/* Feature cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              whileHover={{ y: -6, scale: 1.01 }}
              onClick={() => navigate(feature.path)}
              className={`group p-7 bg-gradient-to-br ${feature.color} rounded-3xl border border-white hover:border-[#B2D2A4]/30 cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-[#B2D2A4]/10`}
            >
              <div className="flex items-start justify-between mb-5">
                <div className={`w-13 h-13 rounded-2xl ${feature.iconBg} flex items-center justify-center w-12 h-12`}>
                  <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${feature.iconBg} ${feature.iconColor}`}>
                  {t(`landing.features.cards.${index}.badge`, feature.badge)}
                </span>
              </div>
              <h3 className="text-lg font-bold text-[#1a2332] mb-3">{t(`landing.features.cards.${index}.title`, feature.title)}</h3>
              <p className="text-sm text-[#4A5568]/70 leading-relaxed mb-4">{t(`landing.features.cards.${index}.description`, feature.description)}</p>
              <div className={`flex items-center gap-1.5 text-sm font-semibold ${feature.iconColor} opacity-0 group-hover:opacity-100 transition-opacity`}>
                {t("landing.features.explore", "Explore feature")}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom highlights bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-[#1a2332] rounded-3xl"
        >
          {highlights.map((h, i) => (
            <div key={i} className="flex items-center gap-3 justify-center md:justify-start">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <h.icon className="w-4 h-4 text-[#B2D2A4]" />
              </div>
              <span className="text-sm font-medium text-white/80">{t(`landing.features.highlights.${i}`, h.text)}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
