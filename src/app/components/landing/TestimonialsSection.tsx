import { motion } from "motion/react";
import { Quote, Star } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

const AVATAR_1 = "https://images.unsplash.com/photo-1542677014-15e371939f4e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";
const AVATAR_2 = "https://images.unsplash.com/photo-1699389795116-415a26475775?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";
const AVATAR_3 = "https://images.unsplash.com/photo-1730894750238-3422737a258f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";

const testimonials = [
  { name: "Sarah Mitchell", avatar: AVATAR_1, savingsColor: "text-[#B2D2A4] bg-[#B2D2A4]/10" },
  { name: "Marcus Chen", avatar: AVATAR_2, savingsColor: "text-green-600 bg-green-50" },
  { name: "Elena Rodriguez", avatar: AVATAR_3, savingsColor: "text-blue-600 bg-blue-50" },
];

const miniReviews = ["James K.", "Anna L.", "Tom B.", "Wei X.", "Sofia M.", "David R."];

export function TestimonialsSection() {
  const { t } = useLanguage();

  return (
    <section className="py-32 bg-gray-50/60">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="flex items-center justify-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className="w-6 h-6 fill-amber-400 text-amber-400" />
            ))}
            <span className="ml-2 font-black text-[#1a2332] text-xl">4.9 / 5.0</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-black text-[#1a2332] mb-6 leading-tight">
            {t("landing.testimonials.titlePrefix")}{" "}
            <span className="text-[#B2D2A4]">{t("landing.testimonials.titleHighlight")}</span>{" "}
            {t("landing.testimonials.titleSuffix")}
          </h2>
          <p className="text-xl text-[#4A5568]/60 max-w-2xl mx-auto">
            {t("landing.testimonials.subtitle")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {testimonials.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              className="bg-white rounded-3xl p-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_40px_rgba(0,0,0,0.1)] transition-all duration-300 border border-gray-100 flex flex-col"
            >
              <Quote className="w-8 h-8 text-[#B2D2A4] mb-5 opacity-60" />
              <p className="text-[#4A5568] leading-relaxed flex-1 mb-6 text-sm">
                "{t(`landing.testimonials.cards.${index}.quote`)}"
              </p>

              <div className="flex gap-1 mb-5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              <div className="flex items-center gap-3">
                <img
                  src={item.avatar}
                  alt={item.name}
                  className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-md"
                />
                <div className="flex-1">
                  <p className="font-bold text-[#1a2332] text-sm">{item.name}</p>
                  <p className="text-xs text-[#4A5568]/50">
                    {t(`landing.testimonials.cards.${index}.role`)}
                  </p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1.5 rounded-xl ${item.savingsColor}`}>
                  {t(`landing.testimonials.cards.${index}.savings`)}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="overflow-hidden relative">
          <div className="flex gap-4 overflow-hidden">
            {[0, 1].map((set) => (
              <motion.div
                key={set}
                className="flex gap-4 flex-shrink-0"
                animate={{ x: ["0%", "-100%"] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                {miniReviews.map((name, i) => (
                  <div
                    key={`${name}-${i}`}
                    className="bg-white rounded-2xl px-5 py-4 border border-gray-100 shadow-sm whitespace-nowrap"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#B2D2A4] to-[#7FB069] flex items-center justify-center text-white text-xs font-bold">
                        {name[0]}
                      </div>
                      <span className="text-sm font-semibold text-[#1a2332]">{name}</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className="w-3 h-3 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-[#4A5568]/70">{t(`landing.testimonials.mini.${i}`)}</p>
                  </div>
                ))}
              </motion.div>
            ))}
          </div>
          <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-gray-50/60 to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-gray-50/60 to-transparent pointer-events-none" />
        </div>
      </div>
    </section>
  );
}
