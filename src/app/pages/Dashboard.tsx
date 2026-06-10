import { useState } from "react";
import { useNavigate } from "react-router";
import { Sidebar } from "../components/Sidebar";
import { BottomNav } from "../components/BottomNav";
import { useFoodMood } from "../context/FoodMoodContext";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Plus, Scan, Clock, ChefHat, TrendingUp, Leaf,
  DollarSign, Bell, BarChart2, ArrowRight, Flame, Package,
  Sparkles, Star
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { motion } from "motion/react";
import { api, RecipeFeedbackAction } from "../../lib/api";
import { formatPersonalRankLabel, personalRankPercent } from "../../lib/mlFormat";
import { useLanguage } from "../context/LanguageContext";

const weeklyData = [
  { day: "Mon", waste: 2, consumed: 8 },
  { day: "Tue", waste: 1, consumed: 9 },
  { day: "Wed", waste: 3, consumed: 7 },
  { day: "Thu", waste: 1, consumed: 9 },
  { day: "Fri", waste: 2, consumed: 8 },
  { day: "Sat", waste: 1, consumed: 9 },
  { day: "Sun", waste: 2, consumed: 8 },
];

const trendData = [
  { week: "W1", saved: 4.2 },
  { week: "W2", saved: 5.8 },
  { week: "W3", saved: 4.1 },
  { week: "W4", saved: 7.3 },
  { week: "W5", saved: 8.9 },
  { week: "W6", saved: 10.2 },
];

export function Dashboard() {
  const navigate = useNavigate();
  const { inventory, userName, userStats, recipes, recommendationsInfo } = useFoodMood();
  const { t } = useLanguage();
  const [showFAB, setShowFAB] = useState(false);

  const source = recommendationsInfo?.source || "fallback";
  const meta = recommendationsInfo?.meta;
  const isML = source === "ml";
  const personalizationApplied = meta?.personalizationApplied ?? false;

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t("pages.dashboard.greetingMorning");
    if (hour < 18) return t("pages.dashboard.greetingAfternoon");
    return t("pages.dashboard.greetingEvening");
  };

  const getExpiringItems = () => {
    const today = new Date();
    return inventory.filter((item) => {
      const days = Math.ceil(
        (new Date(item.expiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      return days <= 3 && days >= 0;
    });
  };

  const expiringItems = getExpiringItems();
  const getDays = (expiryDate: string) =>
    Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  // Send feedback when user clicks a recipe card on dashboard
  const handleRecipeClick = (recipeId: string) => {
    try {
      api.sendRecipeFeedback({
        recipeId,
        action: "view" as RecipeFeedbackAction,
        source,
        timestamp: new Date().toISOString(),
      }).catch(() => {}); // best-effort
    } catch {}
    navigate("/recipes");
  };

  const kpis = [
    {
      label: t("pages.dashboard.foodSaved", "Food Saved"),
      value: `${userStats.foodSavedKg} kg`,
      sublabel: `↑ 12% ${t("pages.dashboard.vsLastMonth", "vs last month")}`,
      icon: TrendingUp,
      color: "text-[#B2D2A4]",
      bg: "bg-[#B2D2A4]/10",
      trend: true,
    },
    {
      label: t("pages.dashboard.co2Offset", "CO₂ Offset"),
      value: `${userStats.co2Offset} kg`,
      sublabel: `↑ 8% ${t("pages.dashboard.vsLastMonth", "vs last month")}`,
      icon: Leaf,
      color: "text-emerald-500",
      bg: "bg-emerald-50",
      trend: true,
    },
    {
      label: t("pages.dashboard.moneySaved", "Money Saved"),
      value: `${Math.round(userStats.moneySaved).toLocaleString('ru-RU')} ₸`,
      sublabel: `↑ 18% ${t("pages.dashboard.vsLastMonth", "vs last month")}`,
      icon: DollarSign,
      color: "text-[#4A5568]",
      bg: "bg-slate-100",
      trend: true,
    },
    {
      label: t("pages.dashboard.itemsInPantry", "Items in Pantry"),
      value: inventory.length,
      sublabel: `${expiringItems.length} ${t("pages.dashboard.expiringSoonShort", "expiring soon")}`,
      icon: Package,
      color: "text-amber-500",
      bg: "bg-amber-50",
      trend: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <BottomNav />

      <main className="lg:ml-64 pb-24 lg:pb-8">
        {/* Top header */}
        <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div>
              <h1 className="font-bold text-[#1a2332]">
                {getTimeGreeting()}, {userName}! 🌿
              </h1>
              <p className="text-xs text-[#4A5568]/50">{t("pages.dashboard.overview")}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/analytics")}
                className="rounded-xl border-gray-200 text-sm hidden sm:flex"
              >
                <BarChart2 className="w-4 h-4 mr-1.5 text-[#B2D2A4]" />
                {t("pages.dashboard.analytics", "Analytics")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/notifications")}
                className="rounded-xl border-gray-200 relative w-9 h-9 p-0"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#B2D2A4] rounded-full text-white text-[9px] flex items-center justify-center font-bold">
                  3
                </span>
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Level badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-linear-to-r from-[#1a2332] to-[#2d3748] rounded-2xl shadow-lg">
              <Flame className="w-4 h-4 text-[#B2D2A4]" />
              <span className="text-white text-sm font-semibold">
                {t("pages.dashboard.level", "Waste Warrior — Level")} {userStats.wasteWarriorLevel}
              </span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i <= userStats.wasteWarriorLevel ? "bg-[#B2D2A4]" : "bg-white/20"
                    }`}
                  />
                ))}
              </div>
            </div>
          </motion.div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {kpis.map((kpi, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.07 }}
              >
                <Card className="p-5 rounded-3xl border-0 shadow-[0_2px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.1)] transition-all duration-300 group cursor-default">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-10 h-10 rounded-2xl ${kpi.bg} flex items-center justify-center`}>
                      <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                    </div>
                    {kpi.trend && (
                      <span className="text-xs text-emerald-500 font-semibold bg-emerald-50 px-2 py-1 rounded-full">
                        +
                      </span>
                    )}
                  </div>
                  <div className="text-2xl font-black text-[#1a2332] mb-0.5">{kpi.value}</div>
                  <div className="text-xs text-[#4A5568]/50 font-medium">{kpi.label}</div>
                  <div className={`text-xs mt-1 font-medium ${kpi.trend ? "text-emerald-500" : "text-amber-500"}`}>
                    {kpi.sublabel}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Main chart */}
            <motion.div
              className="lg:col-span-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="p-6 rounded-3xl border-0 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="font-bold text-[#1a2332]">{t("pages.dashboard.weeklyConsumption", "Weekly Consumption")}</h2>
                    <p className="text-xs text-[#4A5568]/50">{t("pages.dashboard.consumedVsWasted", "Consumed vs Wasted items")}</p>
                  </div>
                  <Badge className="bg-[#B2D2A4]/20 text-[#4A5568] border-0 text-xs">{t("common.thisWeek", "This Week")}</Badge>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={weeklyData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="day" stroke="#9ca3af" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "none",
                        borderRadius: "16px",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="consumed" fill="#B2D2A4" radius={[6, 6, 0, 0]} name={t("pages.dashboard.consumed", "Consumed")} />
                    <Bar dataKey="waste" fill="#fbbf24" radius={[6, 6, 0, 0]} name={t("pages.dashboard.wasted", "Wasted")} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex items-center gap-5 mt-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-[#B2D2A4]" />
                    <span className="text-xs text-[#4A5568]/60">{t("pages.dashboard.consumed", "Consumed")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-[#fbbf24]" />
                    <span className="text-xs text-[#4A5568]/60">{t("pages.dashboard.wasted", "Wasted")}</span>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Trend chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <Card className="p-6 rounded-3xl border-0 shadow-[0_2px_16px_rgba(0,0,0,0.06)] h-full">
                <div className="mb-4">
                  <h2 className="font-bold text-[#1a2332]">{t("pages.dashboard.foodSavedTrend", "Food Saved Trend")}</h2>
                  <p className="text-xs text-[#4A5568]/50">{t("pages.dashboard.kgSavedPerWeek", "kg saved per week")}</p>
                </div>
                <div className="text-3xl font-black text-[#1a2332] mb-1">10.2 kg</div>
                <div className="text-xs text-emerald-500 font-semibold mb-4">↑ 14% {t("common.thisWeek", "this week")}</div>
                <ResponsiveContainer width="100%" height={140}>
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="foodGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#B2D2A4" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#B2D2A4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="saved" stroke="#B2D2A4" strokeWidth={2.5} fill="url(#foodGrad)" dot={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "white", border: "none", borderRadius: "12px", fontSize: "11px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            </motion.div>
          </div>

          {/* Expiring soon */}
          {expiringItems.length > 0 && (
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500" />
                  <h2 className="font-bold text-[#1a2332]">{t("pages.dashboard.expiringSoon", "Expiring Soon")}</h2>
                  <Badge className="bg-amber-100 text-amber-600 border-0 text-xs">
                    {expiringItems.length} {t("common.items", "items")}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/pantry")}
                  className="text-[#4A5568]/60 hover:text-[#1a2332] text-sm"
                >
                  {t("common.viewAll", "View all")}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>

              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {expiringItems.map((item) => {
                  const days = getDays(item.expiryDate);
                  return (
                    <Card
                      key={item.id}
                      className="min-w-60 p-5 rounded-3xl border-2 border-amber-200/60 bg-linear-to-br from-amber-50 to-white shadow-sm hover:shadow-lg transition-all"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-bold text-[#1a2332] text-sm mb-0.5">{item.name}</h3>
                          <p className="text-xs text-[#4A5568]/50">
                            {item.quantity} {item.unit}
                          </p>
                        </div>
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-xl ${ 
                            days <= 1
                              ? "bg-red-100 text-red-500"
                              : "bg-amber-100 text-amber-600"
                          }`}
                        >
                          {days === 0 ? t("pages.dashboard.todayBang", "Today!") : `${days}${t("pages.dashboard.daysLeft", "d left")}`}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        className="w-full bg-[#1a2332] hover:bg-[#2d3748] text-white rounded-xl text-xs"
                        onClick={() => navigate("/recipes")}
                      >
                        <ChefHat className="w-3.5 h-3.5 mr-1.5" />
                        {t("pages.dashboard.findRecipe", "Find Recipe")}
                      </Button>
                    </Card>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Suggested Recipes — SOURCE-AWARE */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-[#B2D2A4]" />
                <h2 className="font-bold text-[#1a2332]">
                  {isML && personalizationApplied
                    ? t("pages.dashboard.aiRecipeSuggestions", "AI Recipe Suggestions")
                    : isML
                    ? t("pages.dashboard.recipeSuggestions", "Recipe Suggestions")
                    : t("pages.dashboard.recommendedRecipes", "Recommended Recipes")}
                </h2>
                {/* ML personalization badge in header */}
                {isML && personalizationApplied && (
                  <Badge variant="outline" className="text-emerald-700 border-emerald-200 text-xs bg-emerald-50">
                    <Sparkles className="w-3 h-3 mr-1" />
                    {t("pages.dashboard.personalized", "Personalized")}
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/recipes")}
                className="text-[#4A5568]/60 hover:text-[#1a2332] text-sm"
              >
                {t("common.viewAll", "View all")}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            {/* Personalization status banner */}
            {isML && !personalizationApplied && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-2 text-sm text-amber-700 mb-4">
                <TrendingUp className="w-4 h-4" />
                <span>
                  {meta?.personalizationDisabledReason
                    ? meta.personalizationDisabledReason
                    : t("pages.dashboard.personalizationUnavailable", "Personalization temporarily unavailable — showing general recommendations")}
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {recipes.slice(0, 3).map((recipe) => (
                <motion.div
                  key={recipe.id}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card
                    className="overflow-hidden rounded-3xl border-0 shadow-[0_2px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)] transition-all duration-300 cursor-pointer"
                    onClick={() => handleRecipeClick(recipe.id)}
                  >
                    <div className="relative">
                      <img
                        src={recipe.image}
                        alt={recipe.name}
                        className="w-full h-44 object-cover"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />
                      <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
                        <span className="px-2.5 py-1 bg-[#B2D2A4] text-[#1a2332] text-xs font-bold rounded-xl shadow">
                          {recipe.matchPercentage}% {t("pages.dashboard.match", "Match")}
                        </span>
                        {isML && personalizationApplied && (
                          <span className="px-2 py-0.5 bg-white/90 text-emerald-700 border border-emerald-200 text-[10px] font-medium rounded-lg flex items-center">
                            <Sparkles className="w-3 h-3 mr-1" />
                            {t("pages.dashboard.personalized", "Personalized")}
                          </span>
                        )}
                        {personalRankPercent(recipe.personalRank) != null && (
                          <span className="px-2 py-0.5 bg-white/90 text-indigo-600 border border-indigo-200 text-[10px] font-medium rounded-lg flex items-center">
                            <Star className="w-3 h-3 mr-1" />
                            {formatPersonalRankLabel(recipe.personalRank)} {t("pages.dashboard.relevance", "Relevance")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-[#1a2332] mb-2">{recipe.name}</h3>
                      <div className="flex items-center gap-3 text-xs text-[#4A5568]/50">
                        <span>⏱ {recipe.cookingTime} {t("pages.dashboard.min", "min")}</span>
                        <span>{recipe.servings} {t("pages.dashboard.servings", "servings")}</span>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>

      {/* FAB */}
      <div className="hidden lg:block fixed bottom-8 right-8 z-40">
        {showFAB && (
          <motion.div
            className="flex flex-col gap-3 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Button
              onClick={() => navigate("/scanner")}
              className="bg-white text-[#1a2332] shadow-xl hover:bg-gray-50 h-12 px-6 rounded-2xl border border-gray-100 font-semibold text-sm"
            >
              <Scan className="w-4 h-4 mr-2" />
              {t("pages.dashboard.quickScan", "Quick Scan")}
            </Button>
            <Button
              onClick={() => navigate("/pantry")}
              className="bg-white text-[#1a2332] shadow-xl hover:bg-gray-50 h-12 px-6 rounded-2xl border border-gray-100 font-semibold text-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("pages.dashboard.addItem", "Add Item")}
            </Button>
          </motion.div>
        )}
        <Button
          onClick={() => setShowFAB(!showFAB)}
          className="bg-[#1a2332] hover:bg-[#2d3748] text-white shadow-2xl w-14 h-14 rounded-2xl"
        >
          <Plus className={`w-6 h-6 transition-transform duration-300 ${showFAB ? "rotate-45" : ""}`} />
        </Button>
      </div>
    </div>
  );
}
