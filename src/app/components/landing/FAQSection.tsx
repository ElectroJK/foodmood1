import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

const faqCount = 8;

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { t } = useLanguage();

  return (
    <section id="faq" className="py-32 bg-gray-50/60">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 text-sm font-medium text-[#4A5568] mb-6 shadow-sm">
            <HelpCircle className="w-4 h-4 text-[#B2D2A4]" />
            {t("landing.faq.eyebrow")}
          </div>
          <h2 className="text-5xl md:text-6xl font-black text-[#1a2332] mb-6 leading-tight">
            {t("landing.faq.titlePrefix")}{" "}
            <span className="text-[#B2D2A4]">{t("landing.faq.titleHighlight")}</span>
          </h2>
          <p className="text-xl text-[#4A5568]/60">
            {t("landing.faq.subtitle")}{" "}
            <a href="mailto:hello@foodmood.app" className="text-[#B2D2A4] hover:underline font-medium">
              {t("landing.faq.contact")}
            </a>
            .
          </p>
        </motion.div>

        <div className="space-y-3">
          {Array.from({ length: faqCount }).map((_, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
            >
              <div className={`bg-white rounded-2xl border overflow-hidden transition-all duration-300 ${
                openIndex === index ? "border-[#B2D2A4]/40 shadow-[0_4px_24px_rgba(178,210,164,0.15)]" : "border-gray-100 shadow-sm hover:border-gray-200"
              }`}>
                <button className="w-full flex items-center justify-between px-7 py-5 text-left" onClick={() => setOpenIndex(openIndex === index ? null : index)}>
                  <span className="font-semibold text-[#1a2332] pr-4">{t(`landing.faq.items.${index}.question`)}</span>
                  <motion.div
                    animate={{ rotate: openIndex === index ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                    className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${openIndex === index ? "bg-[#B2D2A4]/20" : "bg-gray-100"}`}
                  >
                    <ChevronDown className={`w-4 h-4 ${openIndex === index ? "text-[#B2D2A4]" : "text-[#4A5568]"}`} />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="px-7 pb-6 text-[#4A5568]/70 leading-relaxed border-t border-gray-50 pt-4">
                        {t(`landing.faq.items.${index}.answer`)}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
