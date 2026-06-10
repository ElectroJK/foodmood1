import React from "react";
import { NavLink, useNavigate } from "react-router";
import {
  Home, Package, Scan, ChefHat, Users, Leaf,
  User, BarChart2, Bell, LogOut, Settings
} from "lucide-react";
import { cn } from "./ui/utils";
import { useFoodMood } from "../context/FoodMoodContext";
import { auth } from "../../lib/api";
import { supportedLanguages, useLanguage } from "../context/LanguageContext";

export function Sidebar() {
  const navigate = useNavigate();
  const { userName, userStats } = useFoodMood();
  const { language, setLanguage, t } = useLanguage();
  const mainNav = [
    { path: "/dashboard", icon: Home, label: t("nav.dashboard") },
    { path: "/pantry", icon: Package, label: t("nav.pantry") },
    { path: "/scanner", icon: Scan, label: t("nav.scanner") },
    { path: "/recipes", icon: ChefHat, label: t("nav.recipes") },
    { path: "/community", icon: Users, label: t("nav.community") },
    { path: "/analytics", icon: BarChart2, label: t("nav.analytics") },
  ];

  const accountNav = [
    { path: "/notifications", icon: Bell, label: t("nav.notifications") },
    { path: "/profile", icon: Settings, label: t("nav.settings") },
  ];
  const displayName = userName || t("common.guest", "Guest");
  const initial = (displayName.trim()[0] || "G").toUpperCase();

  const handleSignOut = () => {
    auth.setToken(null);
    navigate("/");
  };

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-[#1a2332] flex-col shadow-2xl">
      {/* Logo */}
      <div className="p-6 border-b border-white/8">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <div className="w-9 h-9 rounded-xl bg-linear-to-br from-[#B2D2A4] to-[#7FB069] flex items-center justify-center shadow-lg shadow-[#B2D2A4]/30">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-lg tracking-tight">FoodMood</span>
            <div className="flex items-center gap-1 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#B2D2A4] animate-pulse" />
              <span className="text-white/30 text-xs">{t("common.live", "Live")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <p className="text-xs font-bold text-white/25 uppercase tracking-widest px-3 mb-3">
          {t("nav.main")}
        </p>
        {mainNav.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl mb-1 transition-all duration-200 group",
                isActive
                  ? "bg-white/12 text-white font-semibold"
                  : "text-white/50 hover:bg-white/6 hover:text-white/90"
              )
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all",
                    isActive
                      ? "bg-[#B2D2A4] shadow-lg shadow-[#B2D2A4]/30"
                      : "bg-white/8 group-hover:bg-white/12"
                  )}
                >
                  <item.icon className={cn("w-4 h-4", isActive ? "text-[#1a2332]" : "text-white/60")} />
                </div>
                <span className="text-sm">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#B2D2A4]" />
                )}
              </>
            )}
          </NavLink>
        ))}

        <div className="border-t border-white/8 my-4" />
        <p className="text-xs font-bold text-white/25 uppercase tracking-widest px-3 mb-3">
          {t("nav.account")}
        </p>
        {accountNav.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl mb-1 transition-all duration-200 group",
                isActive
                  ? "bg-white/12 text-white font-semibold"
                  : "text-white/50 hover:bg-white/6 hover:text-white/90"
              )
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all",
                    isActive
                      ? "bg-[#B2D2A4] shadow-lg shadow-[#B2D2A4]/30"
                      : "bg-white/8 group-hover:bg-white/12"
                  )}
                >
                  <item.icon className={cn("w-4 h-4", isActive ? "text-[#1a2332]" : "text-white/60")} />
                </div>
                <span className="text-sm">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-white/8">
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/6 transition-all cursor-pointer mb-2"
          onClick={() => navigate("/profile")}
        >
          <div className="w-9 h-9 rounded-xl bg-linear-to-br from-[#B2D2A4] to-[#7FB069] flex items-center justify-center text-white text-sm font-bold shadow-md shadow-[#B2D2A4]/30 shrink-0">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{displayName}</p>
            <p className="text-xs text-white/35 truncate">
              Waste Warrior · Lvl {userStats.wasteWarriorLevel}
            </p>
          </div>
          <User className="w-4 h-4 text-white/30" />
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/35 hover:text-white/70 hover:bg-white/6 transition-all text-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>{t("nav.signOut")}</span>
        </button>
        <div className="mt-3 flex gap-2">
          {supportedLanguages.map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs uppercase font-semibold",
                language === lang ? "bg-white text-[#1a2332]" : "bg-white/10 text-white/70"
              )}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
