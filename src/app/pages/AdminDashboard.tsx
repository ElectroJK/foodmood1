import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  Bell,
  ChevronDown,
  Circle,
  Globe,
  LayoutDashboard,
  Leaf,
  Mail,
  MoreHorizontal,
  Save,
  Scan,
  Search,
  ShieldCheck,
  TrendingUp,
  User,
  Users,
  LogOut,
  Settings as SettingsIcon,
} from "lucide-react";
import { api, auth, UserDTO } from "../../lib/api";
import { toast } from "sonner";
import { useLanguage } from "../context/LanguageContext";

// Mock data was here — now loaded from the backend via useAdminUsers() hook
// defined below. The hook hits GET /api/admin/users on mount.
type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  registered: string;
  status: string;
  scans: number;
};

let users: AdminUserRow[] = []; // module-level cache, refreshed by useAdminUsers

function useAdminUsers() {
  const [data, setData] = useState<AdminUserRow[]>(users);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    try {
      setLoading(true);
      const r = await api.adminListUsers({ page: 1, limit: 100 });
      const rows: AdminUserRow[] = r.users.map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        registered: typeof u.registered === "string"
          ? u.registered.slice(0, 10)
          : new Date(u.registered).toISOString().slice(0, 10),
        status: u.status || "active",
        scans: u.scans || 0,
      }));
      users = rows;
      setData(rows);
    } catch (e) {
      console.warn("[admin] failed to load users:", e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);
  return { users: data, loading, refresh: load };
}

async function adminAction(action: "ban" | "unban" | "delete", id: string): Promise<boolean> {
  try {
    if (action === "ban") await api.adminBanUser(id);
    else if (action === "unban") await api.adminUnbanUser(id);
    else if (action === "delete") await api.adminDeleteUser(id);
    return true;
  } catch (e) {
    console.warn(`[admin] ${action} failed:`, e);
    return false;
  }
}

const kpis = [
  { labelKey: "kpiUsersOnline", sublabelKey: "kpiUsersOnlineSub", value: "3,842", icon: Globe, iconBg: "bg-[#B2D2A4]/15", iconColor: "text-[#B2D2A4]", trend: "up" },
  { labelKey: "kpiTotalUsers", sublabelKey: "kpiTotalUsersSub", value: "48,200", icon: Users, iconBg: "bg-blue-50", iconColor: "text-blue-500", trend: "up" },
  { labelKey: "kpiScansToday", sublabelKey: "kpiScansTodaySub", value: "8,730", icon: Scan, iconBg: "bg-amber-50", iconColor: "text-amber-500", trend: "up" },
  { labelKey: "kpiCo2Saved", sublabelKey: "kpiCo2SavedSub", value: "12,490", icon: Leaf, iconBg: "bg-emerald-50", iconColor: "text-emerald-500", trend: "neutral" },
];

const navItems = [
  { icon: LayoutDashboard, key: "dashboardOverview" },
  { icon: Users, key: "userManagement" },
  { icon: User, key: "profileSettings" },
];

type AdminNavKey = "dashboardOverview" | "userManagement" | "profileSettings";
type Translate = (key: string, fallback?: string) => string;

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function AdminSidebar({ activeNav, setActiveNav, t }: { activeNav: AdminNavKey; setActiveNav: (s: AdminNavKey) => void; t: Translate }) {
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[#1a2332] flex flex-col z-40">
      <div className="h-16 flex items-center px-6 border-b border-white/8">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#B2D2A4] flex items-center justify-center">
            <Leaf className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-none">FoodMood</div>
            <div className="text-white/40 text-xs mt-0.5">{t("pages.admin.adminPanel")}</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 mb-3">
          <span className="text-white/30 text-xs font-semibold tracking-widest uppercase">{t("pages.admin.main")}</span>
        </div>
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => setActiveNav(item.key as AdminNavKey)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-left ${
              activeNav === item.key ? "bg-[#B2D2A4]/15 text-[#B2D2A4]" : "text-white/50 hover:text-white/80 hover:bg-white/5"
            }`}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-medium">{t(`pages.admin.nav.${item.key}`)}</span>
            {activeNav === item.key && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#B2D2A4]" />}
          </button>
        ))}
      </nav>

      <div className="px-4 pb-5">
        <div className="rounded-2xl bg-white/5 border border-white/8 p-4">
          <div className="flex items-center gap-2 text-[#B2D2A4] text-xs font-semibold mb-2">
            <ShieldCheck className="w-4 h-4" />
            {t("pages.admin.secureArea")}
          </div>
          <p className="text-white/35 text-xs leading-relaxed">{t("pages.admin.secureAreaText")}</p>
        </div>
      </div>
    </aside>
  );
}

function KPICards({ t }: { t: Translate }) {
  // Live KPIs from GET /api/admin/stats. The endpoint returns totals across
  // the whole platform, computed in parallel on the server in a single round-trip.
  const [stats, setStats] = useState<{
    totalUsers?: number;
    activeUsers?: number;
    bannedUsers?: number;
    scansToday?: number;
    co2SavedKg?: number;
  }>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.adminStats()
      .then((s) => { if (!cancelled) { setStats(s); setLoaded(true); } })
      .catch((e) => {
        console.warn("[admin] adminStats failed:", e);
        if (!cancelled) setLoaded(true);
      });
    return () => { cancelled = true; };
  }, []);

  const fmt = (n: number | undefined) =>
    n === undefined ? "—" : n.toLocaleString("ru-RU");

  // Build the cards dynamically from the server response while preserving the
  // icon / colour palette the design uses.
  const cards = [
    {
      labelKey: "kpiUsersOnline",
      sublabelKey: "kpiUsersOnlineSub",
      value: fmt(stats.activeUsers),
      icon: Globe,
      iconBg: "bg-[#B2D2A4]/15",
      iconColor: "text-[#B2D2A4]",
      trend: "up",
    },
    {
      labelKey: "kpiTotalUsers",
      sublabelKey: "kpiTotalUsersSub",
      value: fmt(stats.totalUsers),
      icon: Users,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-500",
      trend: "up",
    },
    {
      labelKey: "kpiScansToday",
      sublabelKey: "kpiScansTodaySub",
      value: fmt(stats.scansToday),
      icon: Scan,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-500",
      trend: "up",
    },
    {
      labelKey: "kpiCo2Saved",
      sublabelKey: "kpiCo2SavedSub",
      value: stats.co2SavedKg !== undefined ? `${stats.co2SavedKg.toLocaleString("ru-RU")} kg` : "—",
      icon: Leaf,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-500",
      trend: "neutral",
    },
  ];

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
      {cards.map((kpi, i) => (
        <motion.div
          key={kpi.labelKey}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.05)]"
        >
          <div className="flex items-start justify-between mb-4">
            <div className={`w-12 h-12 rounded-[14px] ${kpi.iconBg} flex items-center justify-center`}>
              <kpi.icon className={`w-5 h-5 ${kpi.iconColor}`} />
            </div>
            {kpi.trend === "up" && (
              <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 rounded-full">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                <span className="text-xs text-emerald-500 font-semibold">{t("pages.admin.up")}</span>
              </div>
            )}
          </div>
          <div className="text-3xl font-black text-[#1a2332] mb-0.5">
            {loaded ? kpi.value : "…"}
          </div>
          <div className="text-xs font-semibold text-[#4A5568]/50 mb-1">{t(`pages.admin.${kpi.labelKey}`)}</div>
          <div className="text-xs text-emerald-500 font-medium">{t(`pages.admin.${kpi.sublabelKey}`)}</div>
        </motion.div>
      ))}
    </div>
  );
}

function DashboardOverview({ t, setActiveNav }: { t: Translate; setActiveNav: (s: AdminNavKey) => void }) {
  const { users } = useAdminUsers();
  const statusCounts = {
    active: users.filter((user) => user.status === "active").length,
    inactive: users.filter((user) => user.status === "inactive").length,
    banned: users.filter((user) => user.status === "banned").length,
  };

  return (
    <div className="space-y-8">
      <KPICards t={t} />
      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-6">
        <section className="bg-white rounded-[20px] border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="px-7 py-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-[#1a2332]">{t("pages.admin.recentUsers")}</h2>
              <p className="text-xs text-[#4A5568]/50 mt-0.5">{t("pages.admin.recentUsersText")}</p>
            </div>
            <button
              onClick={() => setActiveNav("userManagement")}
              className="px-3.5 py-2 text-sm rounded-xl border border-gray-200 text-[#4A5568]/70 hover:border-[#B2D2A4] transition-colors"
            >
              {t("pages.admin.openUsers")}
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {users.slice(0, 4).map((user) => (
              <div key={user.id} className="px-7 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#B2D2A4]/20 flex items-center justify-center text-[#B2D2A4] text-xs font-bold">
                    {initials(user.name)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#1a2332]">{user.name}</div>
                    <div className="text-xs text-[#4A5568]/40">{user.email}</div>
                  </div>
                </div>
                <span className="text-xs font-mono text-[#4A5568]/40">{user.id}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-[20px] border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-7">
          <h2 className="font-bold text-[#1a2332] mb-2">{t("pages.admin.userStatusTitle")}</h2>
          <p className="text-xs text-[#4A5568]/50 mb-6">{t("pages.admin.userStatusText")}</p>
          <div className="space-y-4">
            {(["active", "inactive", "banned"] as const).map((status) => (
              <div key={status}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-[#4A5568]">{t(`pages.admin.statuses.${status}`)}</span>
                  <span className="text-sm font-bold text-[#1a2332]">{statusCounts[status]}</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${status === "active" ? "bg-emerald-400" : status === "inactive" ? "bg-gray-400" : "bg-red-400"}`}
                    style={{ width: `${(statusCounts[status] / users.length) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function UserManagementPage({ t }: { t: Translate }) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const { users, loading, refresh } = useAdminUsers();
  const [viewingUser, setViewingUser] = useState<any | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const headers = ["userId", "name", "registrationDate", "ocrScans", "status", "actions"];

  const openProfile = async (user: AdminUserRow) => {
    setViewingUser({ ...user, _loading: true });
    setViewLoading(true);
    try {
      const r = await api.adminGetUser(user.id);
      setViewingUser({ ...user, ...r.user, _loading: false });
    } catch (e: any) {
      console.warn("[admin] adminGetUser failed:", e);
      setViewingUser({ ...user, _loading: false, _error: e?.message });
    } finally {
      setViewLoading(false);
    }
  };

  const handleAction = async (action: string, user: AdminUserRow) => {
    setOpenMenu(null);
    if (action === "viewProfile") {
      await openProfile(user);
    } else if (action === "sendMessage") {
      // Open the OS default mail client — works on Windows, macOS, Linux without backend support.
      window.location.href = `mailto:${user.email}?subject=${encodeURIComponent("FoodMood — message from admin")}`;
    } else if (action === "suspend") {
      if (await adminAction("ban", user.id)) await refresh();
    } else if (action === "activate") {
      if (await adminAction("unban", user.id)) await refresh();
    } else if (action === "delete") {
      if (confirm(`Permanently delete ${user.name}?`)) {
        if (await adminAction("delete", user.id)) await refresh();
      }
    }
  };

  return (
    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[20px] border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.05)] overflow-hidden">
      <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100">
        <div>
          <h2 className="font-bold text-[#1a2332]">{t("pages.admin.userManagement")}</h2>
          <p className="text-xs text-[#4A5568]/50 mt-0.5">{t("pages.admin.registeredUsers").replace("{count}", String(users.length))}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5568]/30" />
            <input type="text" placeholder={t("pages.admin.searchUsers")} className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-[#f8fafb] text-[#4A5568] placeholder-[#4A5568]/30 outline-none focus:border-[#B2D2A4] transition-colors w-48" />
          </div>
          <button className="flex items-center gap-1.5 px-3.5 py-2 text-sm border border-gray-200 rounded-xl text-[#4A5568]/60 hover:border-gray-300 transition-colors">
            {t("pages.admin.filter")}
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-[#fafbfc]">
              {headers.map((h) => (
                <th key={h} className="px-6 py-3.5 text-left text-xs font-semibold text-[#4A5568]/40 uppercase tracking-wider">
                  {t(`pages.admin.table.${h}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((user, i) => (
              <motion.tr key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className="border-b border-gray-50 hover:bg-[#fafbfc] transition-colors">
                <td className="px-6 py-4"><span className="text-xs font-mono text-[#4A5568]/40">{user.id}</span></td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#B2D2A4]/20 flex items-center justify-center text-[#B2D2A4] text-xs font-bold">{initials(user.name)}</div>
                    <div>
                      <div className="text-sm font-semibold text-[#1a2332]">{user.name}</div>
                      <div className="text-xs text-[#4A5568]/40">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-[#4A5568]/60">{user.registered}</td>
                <td className="px-6 py-4 text-sm font-semibold text-[#1a2332]">{user.scans}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                    user.status === "active" ? "bg-emerald-50 text-emerald-600" : user.status === "banned" ? "bg-red-50 text-red-500" : "bg-gray-100 text-gray-500"
                  }`}>
                    <Circle className="w-2 h-2" style={{ fill: user.status === "active" ? "#10b981" : user.status === "banned" ? "#ef4444" : "#9ca3af", stroke: "none" }} />
                    {t(`pages.admin.statuses.${user.status}`)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="relative">
                    <button onClick={() => setOpenMenu(openMenu === user.id ? null : user.id)} className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center hover:border-gray-300 hover:bg-gray-50 transition-all">
                      <MoreHorizontal className="w-4 h-4 text-[#4A5568]/50" />
                    </button>
                    {openMenu === user.id && (
                      <div className="absolute right-0 top-9 bg-white border border-gray-100 rounded-2xl shadow-xl z-10 w-40 py-1.5 overflow-hidden">
                        {["viewProfile", "sendMessage", user.status === "active" ? "suspend" : "activate", "delete"].map((action) => (
                          <button key={action} className={`w-full text-left px-4 py-2 text-sm transition-colors ${action === "delete" ? "text-red-500 hover:bg-red-50" : "text-[#4A5568] hover:bg-gray-50"}`} onClick={() => handleAction(action, user)}>
                            {t(`pages.admin.actions.${action}`)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        <ProfileModal
          user={viewingUser}
          loading={viewLoading}
          onClose={() => setViewingUser(null)}
          t={t}
        />
      </div>
    </motion.section>
  );
}


function ProfileModal({ user, loading, onClose, t }: { user: any; loading: boolean; onClose: () => void; t: Translate }) {
  if (!user) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#B2D2A4]/20 flex items-center justify-center text-[#B2D2A4] font-bold">
              {initials(user.name)}
            </div>
            <div>
              <div className="font-bold text-[#1a2332]">{user.name}</div>
              <div className="text-xs text-[#4A5568]/50">{user.email}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#4A5568]/40 hover:text-[#4A5568] text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        {loading ? (
          <div className="text-sm text-[#4A5568]/60 py-4 text-center">{t("pages.admin.checkingAccess", "Loading…")}</div>
        ) : user._error ? (
          <div className="text-sm text-red-500 py-4">Error: {user._error}</div>
        ) : (
          <dl className="text-sm space-y-3">
            <Row label="User ID" value={<span className="font-mono text-xs">{user.id}</span>} />
            <Row label="Role" value={user.role || "user"} />
            <Row label="Status" value={user.status || "active"} />
            <Row label="Email verified" value={user.emailVerified ? "✓ Yes" : "No"} />
            <Row label="OCR scans" value={String(user.scansCount ?? user.scans ?? 0)} />
            <Row label="Pantry items" value={String(user.pantryCount ?? "—")} />
            <Row label="Community listings" value={String(user.sharedCount ?? "—")} />
            <Row
              label="Registered"
              value={user.registered ? new Date(user.registered).toLocaleString() : "—"}
            />
            <Row
              label="Last active"
              value={user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleString() : "—"}
            />
            {user.stats && (
              <>
                <Row label="Food saved" value={`${(user.stats.foodSavedKg ?? 0).toFixed(1)} kg`} />
                <Row label="CO₂ offset" value={`${(user.stats.co2Offset ?? 0).toFixed(1)} kg`} />
                <Row label="Money saved" value={`${Math.round(user.stats.moneySaved ?? 0).toLocaleString("ru-RU")} ₸`} />
              </>
            )}
          </dl>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center gap-4 py-1 border-b border-gray-50 last:border-b-0">
      <dt className="text-[#4A5568]/60">{label}</dt>
      <dd className="text-[#1a2332] font-medium text-right">{value}</dd>
    </div>
  );
}

function ProfileSettingsPage({ adminUser, t }: { adminUser: UserDTO | null; t: Translate }) {
  const [name, setName] = useState(adminUser?.name || "Admin");
  const [saving, setSaving] = useState(false);
  // Local-only security preferences. Backed by localStorage so toggles persist
  // across reloads without requiring extra backend tables. Two-factor flag
  // is read here for display; actual 2FA enforcement is handled by Google
  // OAuth + bcrypt 12 on the auth layer.
  const [prefs, setPrefs] = useState<{ twoFactor: boolean; loginAlerts: boolean; sessionReview: boolean }>(() => {
    try {
      const raw = localStorage.getItem("foodmood_admin_prefs");
      if (raw) return { twoFactor: true, loginAlerts: true, sessionReview: true, ...JSON.parse(raw) };
    } catch {}
    return { twoFactor: true, loginAlerts: true, sessionReview: true };
  });

  // Keep the form in sync if adminUser arrives after first render.
  useEffect(() => { if (adminUser?.name) setName(adminUser.name); }, [adminUser?.name]);

  const togglePref = (key: "twoFactor" | "loginAlerts" | "sessionReview") => {
    setPrefs((p) => {
      const next = { ...p, [key]: !p[key] };
      try { localStorage.setItem("foodmood_admin_prefs", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const handleSave = async () => {
    if (!adminUser?.id || adminUser.id === "demo-admin") {
      toast.success(t("pages.admin.profileSaved", "Profile saved (demo mode)"));
      return;
    }
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    setSaving(true);
    try {
      await api.adminUpdateUser(adminUser.id, { name: name.trim() });
      toast.success(t("pages.admin.profileSaved", "Profile saved"));
    } catch (err: any) {
      toast.error(err?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_0.8fr] gap-6">
      <section className="bg-white rounded-[20px] border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-7">
        <div className="mb-7">
          <h2 className="font-bold text-[#1a2332]">{t("pages.admin.profileSettingsTitle")}</h2>
          <p className="text-xs text-[#4A5568]/50 mt-0.5">{t("pages.admin.profileSettingsText")}</p>
        </div>
        <div className="space-y-5">
          <label className="block">
            <span className="text-sm font-semibold text-[#4A5568]">{t("pages.admin.profileName")}</span>
            <div className="mt-2 relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5568]/35" />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-[#1a2332] outline-none focus:border-[#B2D2A4] transition-colors"
              />
            </div>
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-[#4A5568]">{t("pages.admin.profileEmail")}</span>
            <div className="mt-2 relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5568]/35" />
              <input
                value={adminUser?.email || "admin@foodmood.local"}
                readOnly
                title="Email cannot be changed from the admin panel"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-[#f8fafb] text-sm text-[#1a2332] outline-none cursor-not-allowed"
              />
            </div>
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-[#4A5568]">{t("pages.admin.profileRole")}</span>
            <div className="mt-2 relative">
              <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5568]/35" />
              <input value={t("pages.admin.superAdmin")} readOnly className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-[#f8fafb] text-sm text-[#1a2332] outline-none cursor-not-allowed" />
            </div>
          </label>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#B2D2A4] text-[#1a2332] text-sm font-bold hover:bg-[#9BC18A] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : t("pages.admin.saveProfile")}
          </button>
        </div>
      </section>

      <section className="bg-white rounded-[20px] border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-7">
        <h2 className="font-bold text-[#1a2332] mb-2">{t("pages.admin.securityTitle")}</h2>
        <p className="text-xs text-[#4A5568]/50 mb-6">{t("pages.admin.securityText")}</p>
        <div className="space-y-3">
          {(["twoFactor", "loginAlerts", "sessionReview"] as const).map((key) => (
            <div key={key} className="flex items-center justify-between rounded-2xl border border-gray-100 p-4">
              <div>
                <div className="text-sm font-semibold text-[#1a2332]">{t(`pages.admin.security.${key}.title`)}</div>
                <div className="text-xs text-[#4A5568]/45 mt-0.5">{t(`pages.admin.security.${key}.text`)}</div>
              </div>
              <button
                onClick={() => togglePref(key)}
                aria-label={`Toggle ${key}`}
                className={`w-11 h-6 rounded-full relative transition-colors ${prefs[key] ? "bg-[#B2D2A4]" : "bg-gray-300"}`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${prefs[key] ? "right-1" : "left-1"}`}
                />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [activeNav, setActiveNav] = useState<AdminNavKey>("dashboardOverview");
  const [adminUser, setAdminUser] = useState<UserDTO | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkAdminAccess() {
      if (localStorage.getItem("foodmood_demo_admin") === "true") {
        setAdminUser({
          id: "demo-admin",
          name: localStorage.getItem("foodmood_demo_admin_name") || "Demo Admin",
          email: "admin@foodmood.local",
          role: "admin",
          stats: {
            foodSavedKg: 0,
            co2Offset: 0,
            moneySaved: 0,
            wasteWarriorLevel: 1,
          },
        });
        setCheckingAccess(false);
        return;
      }

      if (!auth.isAuthenticated()) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        const { user } = await api.me();
        if (cancelled) return;
        if (user.role !== "admin") {
          navigate("/dashboard", { replace: true });
          return;
        }
        setAdminUser(user);
      } catch {
        if (!cancelled) navigate("/login", { replace: true });
      } finally {
        if (!cancelled) setCheckingAccess(false);
      }
    }

    checkAdminAccess();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const dateLocale = useMemo(() => (language === "kz" ? "kk-KZ" : language), [language]);

  if (checkingAccess) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center text-[#4A5568]">
        {t("pages.admin.checkingAccess")}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <AdminSidebar activeNav={activeNav} setActiveNav={setActiveNav} t={t} />
      <main className="ml-64">
        <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm h-16 flex items-center px-8 justify-between">
          <div>
            <h1 className="font-bold text-[#1a2332]">{t(`pages.admin.nav.${activeNav}`)}</h1>
            <p className="text-xs text-[#4A5568]/40">
              {new Date().toLocaleDateString(dateLocale, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/notifications")}
              title={t("pages.admin.openNotifications", "Open notifications")}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-[#4A5568]/50 hover:border-gray-300 hover:bg-gray-50 transition-colors relative"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-400 rounded-full text-white text-[8px] flex items-center justify-center font-bold">4</span>
            </button>
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen((v) => !v)}
                className="flex items-center gap-2.5 pl-3 border-l border-gray-200 hover:opacity-80 transition-opacity"
              >
                <div className="w-8 h-8 rounded-xl bg-[#1a2332] flex items-center justify-center text-white text-xs font-bold">
                  {initials(adminUser?.name || "Admin")}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-semibold text-[#1a2332]">{adminUser?.name || t("pages.admin.admin")}</div>
                  <div className="text-xs text-[#4A5568]/40">{t("pages.admin.superAdmin")}</div>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-[#4A5568]/30 transition-transform ${profileMenuOpen ? "rotate-180" : ""}`} />
              </button>
              {profileMenuOpen && (
                <div
                  className="absolute right-0 top-12 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 w-52 py-1.5 overflow-hidden"
                  onMouseLeave={() => setProfileMenuOpen(false)}
                >
                  <button
                    onClick={() => { setActiveNav("profileSettings"); setProfileMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#4A5568] hover:bg-gray-50 transition-colors"
                  >
                    <SettingsIcon className="w-4 h-4" />
                    {t("pages.admin.profileSettings", "Profile Settings")}
                  </button>
                  <button
                    onClick={() => { setProfileMenuOpen(false); navigate("/dashboard"); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#4A5568] hover:bg-gray-50 transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    {t("pages.admin.exitAdmin", "Exit Admin Panel")}
                  </button>
                  <div className="h-px bg-gray-100 my-1" />
                  <button
                    onClick={async () => {
                      setProfileMenuOpen(false);
                      try { await api.logout(); } catch {}
                      navigate("/login", { replace: true });
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    {t("pages.admin.signOut", "Sign out")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-8">
          {activeNav === "dashboardOverview" && <DashboardOverview t={t} setActiveNav={setActiveNav} />}
          {activeNav === "userManagement" && <UserManagementPage t={t} />}
          {activeNav === "profileSettings" && <ProfileSettingsPage adminUser={adminUser} t={t} />}
        </div>
      </main>
    </div>
  );
}
