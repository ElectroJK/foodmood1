import { useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { BottomNav } from "../components/BottomNav";
import { useFoodMood } from "../context/FoodMoodContext";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  TrendingUp, Leaf, DollarSign, BarChart2,
  Calendar, ArrowUp, ArrowDown, Target, Award
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { motion } from "motion/react";
import { useLanguage } from "../context/LanguageContext";

const monthlyData = [
  { month: "Oct", foodSaved: 8.2, co2: 5.7, money: 24.5, waste: 3.1 },
  { month: "Nov", foodSaved: 12.5, co2: 8.8, money: 36.0, waste: 2.4 },
  { month: "Dec", foodSaved: 15.8, co2: 11.1, money: 45.2, waste: 2.8 },
  { month: "Jan", foodSaved: 18.3, co2: 12.8, money: 52.7, waste: 1.9 },
  { month: "Feb", foodSaved: 22.1, co2: 15.5, money: 63.4, waste: 1.6 },
  { month: "Mar", foodSaved: 26.4, co2: 18.5, money: 78.6, waste: 1.2 },
];

const categoryData = [
  { name: "Dairy", value: 28, color: "#B2D2A4" },
  { name: "Veggies", value: 35, color: "#7FB069" },
  { name: "Meat", value: 18, color: "#4A5568" },
  { name: "Fruits", value: 12, color: "#9BC18A" },
  { name: "Grains", value: 7, color: "#CBD5D0" },
];

const weeklyWaste = [
  { day: "Mon", saved: 8, wasted: 2 },
  { day: "Tue", saved: 9, wasted: 1 },
  { day: "Wed", saved: 7, wasted: 3 },
  { day: "Thu", saved: 10, wasted: 0 },
  { day: "Fri", saved: 8, wasted: 2 },
  { day: "Sat", saved: 11, wasted: 1 },
  { day: "Sun", saved: 9, wasted: 1 },
];

const impactTrend = [
  { week: "W1", score: 62 },
  { week: "W2", score: 71 },
  { week: "W3", score: 68 },
  { week: "W4", score: 79 },
  { week: "W5", score: 83 },
  { week: "W6", score: 88 },
  { week: "W7", score: 91 },
  { week: "W8", score: 94 },
];

export function Analytics() {
  const { userStats } = useFoodMood();
  const { t } = useLanguage();
  const [period, setPeriod] = useState<"week" | "month" | "year">("month");

  const periods = ["week", "month", "year"] as const;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <BottomNav />

      <main className="lg:ml-64 pb-20 lg:pb-6">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between flex-wrap gap-4 mb-8"
          >
            <div>
              <h1 className="text-3xl font-bold text-[#4A5568] mb-1">{t("pages.analytics.title")}</h1>
              <p className="text-[#4A5568]/60">{t("pages.analytics.subtitle")}</p>
            </div>
            <div className="flex gap-2 bg-white rounded-xl p-1 shadow-sm border border-gray-100">
              {periods.map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                    period === p
                      ? "bg-[#B2D2A4] text-[#4A5568] shadow-sm"
                      : "text-[#4A5568]/60 hover:text-[#4A5568]"
                  }`}
                >
                  {t(`pages.analytics.${p}`, p)}
                </button>
              ))}
            </div>
          </motion.div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              {
                label: t("pages.analytics.foodSaved", "Food Saved"),
                value: `${userStats.foodSavedKg} kg`,
                icon: TrendingUp,
                change: "+12%",
                positive: true,
                color: "text-[#B2D2A4]",
                bg: "bg-[#B2D2A4]/10",
              },
              {
                label: t("pages.analytics.co2Offset", "CO₂ Offset"),
                value: `${userStats.co2Offset} kg`,
                icon: Leaf,
                change: "+8%",
                positive: true,
                color: "text-green-500",
                bg: "bg-green-50",
              },
              {
                label: t("pages.analytics.moneySaved", "Money Saved"),
                value: `${Math.round(userStats.moneySaved).toLocaleString('ru-RU')} ₸`,
                icon: DollarSign,
                change: "+18%",
                positive: true,
                color: "text-[#4A5568]",
                bg: "bg-slate-50",
              },
              {
                label: t("pages.analytics.wasteRate", "Waste Rate"),
                value: "12%",
                icon: BarChart2,
                change: "-5%",
                positive: true,
                color: "text-amber-500",
                bg: "bg-amber-50",
              },
            ].map((kpi, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-5 rounded-[24px] shadow-[0px_4px_12px_rgba(0,0,0,0.05)]">
                  <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center mb-3`}>
                    <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                  </div>
                  <p className="text-2xl font-bold text-[#4A5568] mb-0.5">{kpi.value}</p>
                  <p className="text-xs text-[#4A5568]/50 mb-2">{kpi.label}</p>
                  <div className={`flex items-center gap-1 text-xs font-medium ${kpi.positive ? "text-green-500" : "text-red-400"}`}>
                    {kpi.positive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                    {kpi.change} {t("pages.analytics.vsLast", "vs last")} {t(`pages.analytics.${period}`, period)}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Charts row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Area chart - food saved over time */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-6 rounded-[24px] shadow-[0px_4px_12px_rgba(0,0,0,0.05)]">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bold text-[#4A5568]">{t("pages.analytics.foodSavedOverTime", "Food Saved Over Time")}</h2>
                  <Badge className="bg-[#B2D2A4]/20 text-[#4A5568]">kg</Badge>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="colorFood" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#B2D2A4" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#B2D2A4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" stroke="#4A5568" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#4A5568" tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "12px" }} />
                    <Area type="monotone" dataKey="foodSaved" stroke="#B2D2A4" strokeWidth={2} fill="url(#colorFood)" name={`${t("pages.analytics.foodSaved", "Food Saved")} (kg)`} />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            </motion.div>

            {/* Category breakdown pie */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card className="p-6 rounded-[24px] shadow-[0px_4px_12px_rgba(0,0,0,0.05)]">
                <h2 className="font-bold text-[#4A5568] mb-6">{t("pages.analytics.savingsByCategory", "Savings by Category")}</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "12px" }} />
                    <Legend iconType="circle" iconSize={8} />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </motion.div>
          </div>

          {/* Charts row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Weekly consumed vs wasted */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="p-6 rounded-[24px] shadow-[0px_4px_12px_rgba(0,0,0,0.05)]">
                <h2 className="font-bold text-[#4A5568] mb-6">{t("pages.analytics.weeklyBreakdown", "Weekly Consumption Breakdown")}</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={weeklyWaste}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" stroke="#4A5568" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#4A5568" tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "12px" }} />
                    <Bar dataKey="saved" fill="#B2D2A4" radius={[6, 6, 0, 0]} name={t("pages.analytics.saved", "Saved")} />
                    <Bar dataKey="wasted" fill="#fbbf24" radius={[6, 6, 0, 0]} name={t("pages.analytics.wasted", "Wasted")} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex gap-4 mt-3 justify-center">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[#B2D2A4]" /><span className="text-xs text-[#4A5568]/60">{t("pages.analytics.saved", "Saved")}</span></div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[#fbbf24]" /><span className="text-xs text-[#4A5568]/60">{t("pages.analytics.wasted", "Wasted")}</span></div>
                </div>
              </Card>
            </motion.div>

            {/* Sustainability score trend */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <Card className="p-6 rounded-[24px] shadow-[0px_4px_12px_rgba(0,0,0,0.05)]">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bold text-[#4A5568]">{t("pages.analytics.sustainabilityScore", "Sustainability Score")}</h2>
                  <div className="text-2xl font-bold text-[#B2D2A4]">94</div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={impactTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="week" stroke="#4A5568" tick={{ fontSize: 12 }} />
                    <YAxis domain={[50, 100]} stroke="#4A5568" tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "12px" }} />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#B2D2A4"
                      strokeWidth={3}
                      dot={{ fill: "#B2D2A4", r: 5 }}
                      name={t("pages.analytics.sustainabilityScore", "Score")}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </motion.div>
          </div>

          {/* Goals section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-6 rounded-[24px] shadow-[0px_4px_12px_rgba(0,0,0,0.05)]">
              <div className="flex items-center gap-2 mb-6">
                <Target className="w-5 h-5 text-[#B2D2A4]" />
                <h2 className="font-bold text-[#4A5568]">{t("pages.analytics.monthlyGoals", "Monthly Goals Progress")}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: t("pages.analytics.foodSaved", "Food Saved"), current: 26.4, target: 30, unit: "kg", color: "bg-[#B2D2A4]" },
                  { label: t("pages.analytics.co2Offset", "CO₂ Offset"), current: 18.5, target: 25, unit: "kg", color: "bg-green-400" },
                  { label: t("pages.analytics.moneySaved", "Money Saved"), current: 78.6, target: 100, unit: "$", color: "bg-[#4A5568]" },
                ].map((goal, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-[#4A5568]">{goal.label}</span>
                      <span className="text-sm text-[#4A5568]/60">
                        {goal.unit === "$" ? `$${goal.current}` : `${goal.current}${goal.unit}`}
                        {" / "}
                        {goal.unit === "$" ? `$${goal.target}` : `${goal.target}${goal.unit}`}
                      </span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${goal.color}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((goal.current / goal.target) * 100, 100)}%` }}
                        transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                      />
                    </div>
                    <p className="text-xs text-[#4A5568]/40 mt-1">
                      {Math.round((goal.current / goal.target) * 100)}% {t("pages.analytics.ofMonthlyGoal", "of monthly goal")}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: "🌿", value: "47", label: t("pages.analytics.itemsSavedThisMonth", "Items Saved This Month") },
                  { icon: "🍳", value: "12", label: t("pages.analytics.recipesCooked", "Recipes Cooked") },
                  { icon: "🤝", value: "5", label: t("pages.analytics.itemsShared", "Items Shared") },
                  { icon: "📱", value: "8", label: t("pages.analytics.receiptsScanned", "Receipts Scanned") },
                ].map((stat, i) => (
                  <div key={i} className="text-center p-4 bg-gray-50 rounded-2xl">
                    <div className="text-2xl mb-1">{stat.icon}</div>
                    <p className="text-xl font-bold text-[#4A5568]">{stat.value}</p>
                    <p className="text-xs text-[#4A5568]/50">{stat.label}</p>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
