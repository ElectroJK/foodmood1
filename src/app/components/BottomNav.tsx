import { NavLink } from "react-router";
import { Home, Package, Scan, ChefHat, Users, User } from "lucide-react";
import { cn } from "./ui/utils";
import { useLanguage } from "../context/LanguageContext";

export function BottomNav() {
  const { t } = useLanguage();
  const navItems = [
    { path: "/dashboard", icon: Home, label: t("nav.home") },
    { path: "/pantry", icon: Package, label: t("nav.pantry") },
    { path: "/scanner", icon: Scan, label: t("nav.scanner") },
    { path: "/recipes", icon: ChefHat, label: t("nav.recipes") },
    { path: "/community", icon: Users, label: t("nav.share") },
    { path: "/profile", icon: User, label: t("nav.profile") },
  ];
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#1a2332]/98 backdrop-blur-xl border-t border-white/8 z-50 shadow-2xl">
      <div className="flex items-center justify-around px-2 py-2 safe-area-pb">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-all min-w-[48px]",
                isActive ? "text-[#B2D2A4]" : "text-white/35 hover:text-white/70"
              )
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                    isActive ? "bg-[#B2D2A4]/20" : ""
                  )}
                >
                  <item.icon className="w-4.5 h-4.5 w-[18px] h-[18px]" />
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
