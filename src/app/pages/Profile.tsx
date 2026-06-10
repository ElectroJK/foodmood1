import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Sidebar } from "../components/Sidebar";
import { BottomNav } from "../components/BottomNav";
import { useFoodMood } from "../context/FoodMoodContext";
import { api, auth } from "../../lib/api";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  User, Mail, Bell, Shield, LogOut, ChevronRight,
  Camera, TrendingUp, Leaf, DollarSign, Award,
  Moon, Globe, Trash2, Download, Save
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { supportedLanguages, useLanguage } from "../context/LanguageContext";

export function Profile() {
  const navigate = useNavigate();
  const { userName, userStats } = useFoodMood();
  const { language: appLanguage, setLanguage: setAppLanguage, t } = useLanguage();

  const [activeSection, setActiveSection] = useState<"account" | "notifications" | "privacy" | "preferences">("account");
  const [displayName, setDisplayName] = useState(userName || "");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState(t("pages.profile.bioDefault", "Passionate about reducing food waste and sustainable living 🌿"));
  const [notifications, setNotifications] = useState({
    expiryAlerts: true,
    communityUpdates: true,
    weeklyReport: true,
    recipeRecommendations: true,
    marketplaceActivity: false,
  });
  const [darkMode, setDarkMode] = useState(false);

  // Pull the current user from the backend once on mount.
  useEffect(() => {
    let cancelled = false;
    api
      .me()
      .then((res) => {
        if (cancelled) return;
        setDisplayName(res.user.name);
        setEmail(res.user.email);
      })
      .catch(() => {
        // Not logged in or token expired — silently degrade.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Keep displayName in sync when context userName updates.
  useEffect(() => {
    if (userName && !displayName) setDisplayName(userName);
  }, [userName]);

  const handleSave = () => {
    toast.success(t("pages.profile.profileUpdated", "Profile updated successfully!"));
  };

  const handleLogout = () => {
    auth.setToken(null);
    toast.info(t("pages.profile.loggingOut", "Logging out..."));
    setTimeout(() => navigate("/"), 600);
  };

  const initial = (displayName.trim()[0] || "G").toUpperCase();

  const menuItems = [
    { id: "account", icon: User, label: t("pages.profile.accountInfo", "Account Info") },
    { id: "notifications", icon: Bell, label: t("pages.profile.notifications", "Notifications") },
    { id: "preferences", icon: Globe, label: t("pages.profile.preferences", "Preferences") },
    { id: "privacy", icon: Shield, label: t("pages.profile.privacy", "Privacy & Security") },
  ] as const;

  const achievements = [
    { icon: "🌿", title: "Waste Warrior", desc: "Saved 100+ kg of food", unlocked: userStats.foodSavedKg >= 100 },
    { icon: "♻️", title: "Eco Champion", desc: "Offset 50+ kg CO₂", unlocked: userStats.co2Offset >= 50 },
    { icon: "👥", title: "Community Star", desc: "Shared 10+ items", unlocked: false },
    { icon: "🍳", title: "Master Chef", desc: "Used 50 recipes", unlocked: false },
    { icon: "📱", title: "Scanner Pro", desc: "Scanned 100 receipts", unlocked: false },
    { icon: "💰", title: "Money Saver", desc: "Saved $500+", unlocked: userStats.moneySaved >= 500 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <BottomNav />

      <main className="lg:ml-64 pb-20 lg:pb-6">
        <div className="max-w-6xl mx-auto p-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-[#4A5568] mb-1">{t("pages.profile.title")}</h1>
            <p className="text-[#4A5568]/60">{t("pages.profile.subtitle")}</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left sidebar */}
            <motion.div
              className="lg:col-span-1 space-y-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              {/* Avatar Card */}
              <Card className="p-6 text-center rounded-[24px] shadow-[0px_4px_12px_rgba(0,0,0,0.05)]">
                <div className="relative w-20 h-20 mx-auto mb-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#B2D2A4] to-[#7FB069] flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                    {initial}
                  </div>
                  <button className="absolute bottom-0 right-0 w-7 h-7 bg-[#4A5568] rounded-full flex items-center justify-center shadow-md hover:bg-[#2D3748] transition-colors">
                    <Camera className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
                <h3 className="font-bold text-[#4A5568] mb-0.5">{displayName || t("common.guest", "Guest")}</h3>
                <p className="text-xs text-[#4A5568]/50 mb-3">{email || "—"}</p>
                <Badge className="bg-[#B2D2A4]/20 text-[#4A5568] border-[#B2D2A4]/30">
                  Waste Warrior Lvl {userStats.wasteWarriorLevel}
                </Badge>
              </Card>

              {/* Stats mini */}
              <Card className="p-4 rounded-[24px] shadow-[0px_4px_12px_rgba(0,0,0,0.05)]">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#B2D2A4]" />
                  <span className="text-sm text-[#4A5568]/70">{t("pages.profile.foodSaved", "Food Saved")}</span>
                    </div>
                    <span className="font-bold text-[#4A5568]">{userStats.foodSavedKg} kg</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Leaf className="w-4 h-4 text-[#B2D2A4]" />
                      <span className="text-sm text-[#4A5568]/70">CO₂ Offset</span>
                    </div>
                    <span className="font-bold text-[#4A5568]">{userStats.co2Offset} kg</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-[#B2D2A4]" />
                      <span className="text-sm text-[#4A5568]/70">{t("pages.profile.saved", "Saved")}</span>
                    </div>
                    <span className="font-bold text-[#4A5568]">{Math.round(userStats.moneySaved).toLocaleString('ru-RU')} ₸</span>
                  </div>
                </div>
              </Card>

              {/* Nav menu */}
              <Card className="p-2 rounded-[24px] shadow-[0px_4px_12px_rgba(0,0,0,0.05)]">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-left ${
                      activeSection === item.id
                        ? "bg-[#B2D2A4]/20 text-[#4A5568]"
                        : "text-[#4A5568]/60 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={`w-4 h-4 ${activeSection === item.id ? "text-[#B2D2A4]" : ""}`} />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-40" />
                  </button>
                ))}
                <div className="border-t border-gray-100 mt-2 pt-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-50 transition-all text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-medium">{t("nav.signOut", "Sign Out")}</span>
                  </button>
                </div>
              </Card>
            </motion.div>

            {/* Right content */}
            <motion.div
              className="lg:col-span-3 space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              {/* Account Info */}
              {activeSection === "account" && (
                <>
                  <Card className="p-6 rounded-[24px] shadow-[0px_4px_12px_rgba(0,0,0,0.05)]">
                    <h2 className="text-lg font-bold text-[#4A5568] mb-6">{t("pages.profile.accountInfo", "Account Information")}</h2>
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-[#4A5568] mb-1.5 block">{t("pages.profile.displayName", "Display Name")}</label>
                          <Input
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-[#4A5568] mb-1.5 block">{t("pages.profile.emailAddress", "Email Address")}</label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5568]/40" />
                            <Input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="pl-9 rounded-xl"
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-[#4A5568] mb-1.5 block">{t("pages.profile.bio", "Bio")}</label>
                        <textarea
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-[#4A5568] focus:outline-none focus:ring-2 focus:ring-[#B2D2A4]/30 focus:border-[#B2D2A4] resize-none"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-[#4A5568] mb-1.5 block">{t("pages.profile.location", "Location")}</label>
                          <Input defaultValue="Almaty, KZ" className="rounded-xl" />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-[#4A5568] mb-1.5 block">{t("pages.profile.householdSize", "Household Size")}</label>
                          <select className="w-full px-3 py-2 h-10 rounded-xl border border-gray-200 text-sm text-[#4A5568] focus:outline-none focus:ring-2 focus:ring-[#B2D2A4]/30 bg-white">
                            <option>{t("pages.profile.onePerson", "1 person")}</option>
                            <option>{t("pages.profile.twoPeople", "2 people")}</option>
                            <option>{t("pages.profile.threeFourPeople", "3-4 people")}</option>
                            <option>{t("pages.profile.fivePlusPeople", "5+ people")}</option>
                          </select>
                        </div>
                      </div>
                      <Button
                        onClick={handleSave}
                        className="bg-[#B2D2A4] hover:bg-[#9BC18A] text-[#4A5568] rounded-xl px-8"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {t("pages.profile.saveChanges", "Save Changes")}
                      </Button>
                    </div>
                  </Card>

                  {/* Achievements */}
                  <Card className="p-6 rounded-[24px] shadow-[0px_4px_12px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center gap-2 mb-6">
                      <Award className="w-5 h-5 text-[#B2D2A4]" />
                      <h2 className="text-lg font-bold text-[#4A5568]">{t("pages.profile.achievements", "Achievements")}</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {achievements.map((achievement, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-2xl text-center border transition-all ${
                            achievement.unlocked
                              ? "bg-[#B2D2A4]/10 border-[#B2D2A4]/30"
                              : "bg-gray-50 border-gray-100 opacity-50"
                          }`}
                        >
                          <div className="text-3xl mb-2">{achievement.icon}</div>
                          <p className="text-sm font-semibold text-[#4A5568] mb-1">{achievement.title}</p>
                          <p className="text-xs text-[#4A5568]/50">{achievement.desc}</p>
                          {achievement.unlocked && (
                            <Badge className="mt-2 bg-[#B2D2A4] text-white text-xs">{t("pages.profile.unlocked", "Unlocked")}</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>
                </>
              )}

              {/* Notifications */}
              {activeSection === "notifications" && (
                <Card className="p-6 rounded-[24px] shadow-[0px_4px_12px_rgba(0,0,0,0.05)]">
                  <h2 className="text-lg font-bold text-[#4A5568] mb-6">{t("pages.profile.notificationSettings", "Notification Settings")}</h2>
                  <div className="space-y-4">
                    {Object.entries(notifications).map(([key, value]) => {
                      const labels: Record<string, { label: string; desc: string }> = {
                        expiryAlerts: { label: t("pages.profile.expiryAlerts", "Expiry Alerts"), desc: t("pages.profile.expiryAlertsDesc", "Get notified when items are about to expire") },
                        communityUpdates: { label: t("pages.profile.communityUpdates", "Community Updates"), desc: t("pages.profile.communityUpdatesDesc", "New items shared near you") },
                        weeklyReport: { label: t("pages.profile.weeklyReport", "Weekly Report"), desc: t("pages.profile.weeklyReportDesc", "Your weekly sustainability summary") },
                        recipeRecommendations: { label: t("pages.profile.recipeRecommendations", "Recipe Recommendations"), desc: t("pages.profile.recipeRecommendationsDesc", "Personalized recipe suggestions") },
                        marketplaceActivity: { label: t("pages.profile.marketplaceActivity", "Marketplace Activity"), desc: t("pages.profile.marketplaceActivityDesc", "Updates on your shared items") },
                      };
                      return (
                        <div key={key} className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors">
                          <div>
                            <p className="font-medium text-[#4A5568]">{labels[key]?.label}</p>
                            <p className="text-sm text-[#4A5568]/50">{labels[key]?.desc}</p>
                          </div>
                          <button
                            onClick={() => setNotifications((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                            className={`w-12 h-6 rounded-full transition-all relative ${value ? "bg-[#B2D2A4]" : "bg-gray-200"}`}
                          >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${value ? "right-1" : "left-1"}`} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <Button
                    onClick={() => toast.success(t("pages.profile.notificationPreferencesSaved", "Notification preferences saved!"))}
                    className="mt-6 bg-[#B2D2A4] hover:bg-[#9BC18A] text-[#4A5568] rounded-xl px-8"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {t("pages.profile.savePreferences", "Save Preferences")}
                  </Button>
                </Card>
              )}

              {/* Preferences */}
              {activeSection === "preferences" && (
                <Card className="p-6 rounded-[24px] shadow-[0px_4px_12px_rgba(0,0,0,0.05)]">
                  <h2 className="text-lg font-bold text-[#4A5568] mb-6">{t("pages.profile.appPreferences", "App Preferences")}</h2>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <Moon className="w-5 h-5 text-[#4A5568]/50" />
                        <div>
                          <p className="font-medium text-[#4A5568]">{t("pages.profile.darkMode", "Dark Mode")}</p>
                          <p className="text-sm text-[#4A5568]/50">{t("pages.profile.darkModeDesc", "Switch to dark interface")}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => { setDarkMode(!darkMode); toast.info(t("pages.profile.darkModeSoon", "Dark mode coming soon!")); }}
                        className={`w-12 h-6 rounded-full transition-all relative ${darkMode ? "bg-[#B2D2A4]" : "bg-gray-200"}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${darkMode ? "right-1" : "left-1"}`} />
                      </button>
                    </div>

                    <div className="p-4 rounded-xl hover:bg-gray-50">
                      <div className="flex items-center gap-3 mb-3">
                        <Globe className="w-5 h-5 text-[#4A5568]/50" />
                        <div>
                          <p className="font-medium text-[#4A5568]">{t("pages.profile.language", "Language")}</p>
                          <p className="text-sm text-[#4A5568]/50">{t("pages.profile.languageDesc", "Choose your preferred language")}</p>
                        </div>
                      </div>
                      <select
                        value={appLanguage}
                        onChange={(e) => { setAppLanguage(e.target.value as typeof appLanguage); toast.success(`${t("pages.profile.languageChanged", "Language changed to")} ${e.target.value}`); }}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-[#4A5568] focus:outline-none focus:ring-2 focus:ring-[#B2D2A4]/30 bg-white"
                      >
                        {supportedLanguages.map((lang) => (
                          <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                        ))}
                      </select>
                    </div>

                    <div className="p-4 rounded-xl hover:bg-gray-50">
                      <p className="font-medium text-[#4A5568] mb-1">{t("pages.profile.expiryThreshold", "Expiry Alert Threshold")}</p>
                      <p className="text-sm text-[#4A5568]/50 mb-3">{t("pages.profile.expiryThresholdDesc", "Notify me when items expire within")}</p>
                      <div className="flex gap-2">
                        {[1, 2, 3, 5, 7].map((days) => (
                          <button
                            key={days}
                            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all border ${
                              days === 3
                                ? "bg-[#B2D2A4] text-[#4A5568] border-[#B2D2A4]"
                                : "border-gray-200 text-[#4A5568]/60 hover:bg-gray-50"
                            }`}
                          >
                            {days}d
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => toast.success(t("pages.profile.preferencesSaved", "Preferences saved!"))}
                    className="mt-6 bg-[#B2D2A4] hover:bg-[#9BC18A] text-[#4A5568] rounded-xl px-8"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {t("pages.profile.savePreferences", "Save Preferences")}
                  </Button>
                </Card>
              )}

              {/* Privacy */}
              {activeSection === "privacy" && (
                <Card className="p-6 rounded-[24px] shadow-[0px_4px_12px_rgba(0,0,0,0.05)]">
                  <h2 className="text-lg font-bold text-[#4A5568] mb-6">{t("pages.profile.privacy", "Privacy & Security")}</h2>
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl border border-gray-100">
                      <h3 className="font-medium text-[#4A5568] mb-1">{t("pages.profile.changePassword", "Change Password")}</h3>
                      <p className="text-sm text-[#4A5568]/50 mb-3">{t("pages.profile.changePasswordDesc", "Update your account password")}</p>
                      <div className="space-y-3">
                        <Input type="password" placeholder={t("pages.profile.currentPassword", "Current password")} className="rounded-xl" />
                        <Input type="password" placeholder={t("pages.profile.newPassword", "New password")} className="rounded-xl" />
                        <Input type="password" placeholder={t("pages.profile.confirmNewPassword", "Confirm new password")} className="rounded-xl" />
                        <Button
                          onClick={() => toast.success(t("pages.profile.passwordUpdated", "Password updated!"))}
                          className="bg-[#4A5568] hover:bg-[#2D3748] text-white rounded-xl"
                        >
                          {t("pages.profile.updatePassword", "Update Password")}
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-gray-100">
                      <h3 className="font-medium text-[#4A5568] mb-1">{t("pages.profile.dataExport", "Data Export")}</h3>
                      <p className="text-sm text-[#4A5568]/50 mb-3">{t("pages.profile.dataExportDesc", "Download all your FoodMood data")}</p>
                      <Button
                        variant="outline"
                        onClick={() => toast.success(t("pages.profile.exportPreparing", "Your data export is being prepared!"))}
                        className="rounded-xl"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        {t("pages.profile.exportMyData", "Export My Data")}
                      </Button>
                    </div>

                    <div className="p-4 rounded-xl border border-red-100 bg-red-50/50">
                      <h3 className="font-medium text-red-500 mb-1">{t("pages.profile.deleteAccount", "Delete Account")}</h3>
                      <p className="text-sm text-[#4A5568]/50 mb-3">
                        {t("pages.profile.deleteAccountDesc", "Permanently delete your account and all associated data")}
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => toast.error(t("pages.profile.deleteContactSupport", "Please contact support to delete your account"))}
                        className="border-red-300 text-red-400 hover:bg-red-50 rounded-xl"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {t("pages.profile.deleteAccount", "Delete Account")}
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
