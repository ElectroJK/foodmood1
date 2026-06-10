import { useNavigate } from "react-router";
import { ArrowUpRight, Github, Instagram, Leaf, Linkedin, Mail, Twitter } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

const footerLinks = {
  product: [
    { key: "dashboard", path: "/dashboard" },
    { key: "pantry", path: "/pantry" },
    { key: "scanner", path: "/scanner" },
    { key: "recipes", path: "/recipes" },
    { key: "community", path: "/community" },
    { key: "analytics", path: "/analytics" },
  ],
  company: [
    { key: "about", path: "#" },
    { key: "blog", path: "#" },
    { key: "careers", path: "#" },
    { key: "press", path: "#" },
    { key: "partners", path: "#" },
  ],
  support: [
    { key: "help", path: "#" },
    { key: "forum", path: "#" },
    { key: "contact", path: "#" },
    { key: "status", path: "#" },
    { key: "api", path: "#" },
  ],
  legal: [
    { key: "privacy", path: "#" },
    { key: "terms", path: "#" },
    { key: "cookies", path: "#" },
    { key: "gdpr", path: "#" },
  ],
};

const socials = [
  { icon: Twitter, label: "Twitter", href: "#" },
  { icon: Instagram, label: "Instagram", href: "#" },
  { icon: Github, label: "GitHub", href: "#" },
  { icon: Linkedin, label: "LinkedIn", href: "#" },
];

export function FooterSection() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <footer className="bg-[#1a2332] text-white">
      <div className="border-b border-white/8">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold mb-1">{t("landing.footer.newsletterTitle")}</h3>
              <p className="text-white/50 text-sm">{t("landing.footer.newsletterText")}</p>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <input
                type="email"
                placeholder={t("landing.footer.emailPlaceholder")}
                className="flex-1 md:w-72 px-5 py-3 bg-white/8 border border-white/10 rounded-2xl text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#B2D2A4]/50 transition-colors"
              />
              <button className="px-6 py-3 bg-[#B2D2A4] hover:bg-[#9BC18A] text-[#1a2332] rounded-2xl font-semibold text-sm transition-all whitespace-nowrap">
                {t("landing.footer.subscribe")}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-10 mb-16">
          <div className="col-span-2">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-xl bg-linear-to-br from-[#B2D2A4] to-[#7FB069] flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">FoodMood</span>
            </div>
            <p className="text-white/50 text-sm leading-relaxed mb-6">{t("landing.footer.description")}</p>
            <div className="flex gap-3">
              {socials.map((social) => (
                <a key={social.label} href={social.href} aria-label={social.label} className="w-9 h-9 rounded-xl bg-white/8 hover:bg-white/15 flex items-center justify-center transition-colors">
                  <social.icon className="w-4 h-4 text-white/60" />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-bold text-sm text-white/90 mb-4 tracking-wide">
                {t(`landing.footer.categories.${category}`)}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.key}>
                    <button
                      onClick={() => (link.path !== "#" ? navigate(link.path) : undefined)}
                      className="text-sm text-white/45 hover:text-white transition-colors flex items-center gap-1 group leading-snug"

                    >
                      {t(`landing.footer.links.${link.key}`)}
                      {link.path === "#" && <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-8 border-t border-white/8">
          <div className="flex items-center gap-2 text-white/40 text-sm">
            <Mail className="w-4 h-4" />
            <a href="mailto:hello@foodmood.app" className="hover:text-white transition-colors">
              hello@foodmood.app
            </a>
          </div>
          <p className="text-white/30 text-sm">{t("landing.footer.copyright")}</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#B2D2A4] animate-pulse" />
            <span className="text-white/40 text-sm">{t("landing.footer.systemsOperational")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
