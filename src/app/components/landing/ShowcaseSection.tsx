import { motion } from "motion/react";
import { Scan, ChefHat, Users, CheckCircle2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router";
import { useLanguage } from "../../context/LanguageContext";

const SCANNER_IMG = "https://images.unsplash.com/photo-1770350482639-363fe563311a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncm9jZXJ5JTIwc2hvcHBpbmclMjBzdXN0YWluYWJsZSUyMGJhZ3N8ZW58MXx8fHwxNzc0MDA5Njc2fDA&ixlib=rb-4.1.0&q=80&w=1080";
const RECIPE_IMG = "https://images.unsplash.com/photo-1767105267943-0d34ab68d2a1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGh5JTIwbWVhbCUyMHByZXAlMjBib3dsc3xlbnwxfHx8fDE3NzM5NDU4OTJ8MA&ixlib=rb-4.1.0&q=80&w=1080";
const COMMUNITY_IMG = "https://images.unsplash.com/photo-1766132257906-0a95391a7239?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tdW5pdHklMjBwZW9wbGUlMjBzaGFyaW5nJTIwZm9vZCUyMG91dGRvb3JzfGVufDF8fHx8MTc3NDAwOTY3OHww&ixlib=rb-4.1.0&q=80&w=1080";

const showcases = [
  {
    tag: "Feature 01",
    tagColor: "text-[#B2D2A4] bg-[#B2D2A4]/15",
    icon: Scan,
    title: "Scan receipts in seconds, not minutes",
    description:
      "Our AI-powered OCR reads your grocery receipts instantly. It extracts item names, quantities, prices, and even predicts expiry dates using smart category recognition — so you spend less time entering data and more time enjoying food.",
    image: SCANNER_IMG,
    imageAlt: "OCR Receipt Scanning",
    bullets: [
      "Supports all major grocery store receipt formats",
      "Confidence score per item with manual override",
      "Batch-add to pantry with one tap",
      "Works from photos, PDFs, and emails",
    ],
    cta: "Try the Scanner",
    ctaPath: "/scanner",
    imageRight: false,
    accent: "#B2D2A4",
  },
  {
    tag: "Feature 02",
    tagColor: "text-amber-600 bg-amber-50",
    icon: ChefHat,
    title: "Recipes that rescue your pantry",
    description:
      "FoodMood's recipe engine analyses what's in your fridge and generates personalized recipe suggestions ranked by ingredient match. The closer to expiry, the higher the recipe is prioritized — turning near-expired food into gourmet meals.",
    image: RECIPE_IMG,
    imageAlt: "Smart Recipes",
    bullets: [
      "AI matches recipes to your exact inventory",
      "Prioritizes items expiring soonest",
      "Step-by-step cooking instructions included",
      "One-tap ingredient deduction from pantry",
    ],
    cta: "Explore Recipes",
    ctaPath: "/recipes",
    imageRight: true,
    accent: "#f59e0b",
  },
  {
    tag: "Feature 03",
    tagColor: "text-blue-600 bg-blue-50",
    icon: Users,
    title: "Share food, build community",
    description:
      "Why let surplus food go to waste when your neighbors might need it? FoodMood's marketplace connects you with your local community. List items, request pickups, and see real-time availability on an interactive map — all within walking distance.",
    image: COMMUNITY_IMG,
    imageAlt: "Community Food Sharing",
    bullets: [
      "Interactive map showing nearby listings",
      "In-app messaging with pickup coordination",
      "Earn eco points for every item shared",
      "Verified community members only",
    ],
    cta: "Join Community",
    ctaPath: "/community",
    imageRight: false,
    accent: "#3b82f6",
  },
];

export function ShowcaseSection() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <section className="py-20 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 space-y-32">
        {showcases.map((showcase, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className={`grid grid-cols-1 lg:grid-cols-2 gap-16 items-center ${
              showcase.imageRight ? "lg:grid-flow-col-dense" : ""
            }`}
          >
            {/* Text content */}
            <div className={showcase.imageRight ? "lg:col-start-1" : ""}>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-5 ${showcase.tagColor}`}>
                <showcase.icon className="w-3.5 h-3.5" />
                {t(`landing.showcase.cards.${index}.tag`, showcase.tag)}
              </div>

              <h2 className="text-4xl md:text-5xl font-black text-[#1a2332] mb-6 leading-tight">
                {t(`landing.showcase.cards.${index}.title`, showcase.title)}
              </h2>
              <p className="text-lg text-[#4A5568]/70 leading-relaxed mb-8">
                {t(`landing.showcase.cards.${index}.description`, showcase.description)}
              </p>

              <ul className="space-y-3 mb-10">
                {showcase.bullets.map((bullet, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 + i * 0.08 }}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle2
                      className="w-5 h-5 flex-shrink-0 mt-0.5"
                      style={{ color: showcase.accent }}
                    />
                    <span className="text-[#4A5568] font-medium">{t(`landing.showcase.cards.${index}.bullets.${i}`, bullet)}</span>
                  </motion.li>
                ))}
              </ul>

              <button
                onClick={() => navigate(showcase.ctaPath)}
                className="group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                style={{
                  backgroundColor: showcase.accent + "20",
                  color: showcase.accent,
                  border: `1.5px solid ${showcase.accent}40`,
                }}
              >
                {t(`landing.showcase.cards.${index}.cta`, showcase.cta)}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Image */}
            <motion.div
              className={`relative ${showcase.imageRight ? "lg:col-start-2" : ""}`}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.4 }}
            >
              <div
                className="absolute inset-0 rounded-3xl blur-3xl opacity-20 scale-90"
                style={{ backgroundColor: showcase.accent }}
              />
              <div className="relative rounded-3xl overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.12)] border border-white">
                <img
                  src={showcase.image}
                  alt={showcase.imageAlt}
                  className="w-full h-80 lg:h-[480px] object-cover"
                />
                {/* Overlay label */}
                <div className="absolute bottom-5 left-5 right-5">
                  <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: showcase.accent + "20" }}
                    >
                      <showcase.icon className="w-5 h-5" style={{ color: showcase.accent }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#1a2332]">{t(`landing.showcase.cards.${index}.overlayTitle`, showcase.tag.split(" ")[1] === "01" ? "Smart OCR Scanning" : showcase.tag.split(" ")[1] === "02" ? "AI Recipe Engine" : "Community Marketplace")}</p>
                      <p className="text-xs text-[#4A5568]/60">
                        {t(`landing.showcase.cards.${index}.overlayStat`, index === 0 ? "95% accuracy rate" : index === 1 ? "500+ curated recipes" : "1,400+ active members")}
                      </p>
                    </div>
                    <CheckCircle2
                      className="w-5 h-5 ml-auto"
                      style={{ color: showcase.accent }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
