import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { api, NotificationDTO } from "../../lib/api";
import { Sidebar } from "../components/Sidebar";
import { BottomNav } from "../components/BottomNav";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import {
  Clock,
  ChefHat,
  Users,
  Trophy,
  Settings,
  Bell,
  Sparkles,
  ArrowRight,
  X,
  Star,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

interface Notification {
  id: string;
  type: "expiry" | "recipe" | "community" | "achievement" | "system" | "ml-recipe";
  title: string;
  message: string;
  time: string;
  read: boolean;
  actionLabel?: string;
  actionPath?: string;
  // ── ML-specific UI fields ──
  /** Canonical name of the expiring product (from ML) */
  canonicalName?: string;
  /** Days until expiry */
  daysToExpiry?: number;
  /** Suggested recipes from ML notification */
  recipes?: Array<{
    id: string;
    name: string;
    image: string;
    matchPercentage: number;
    cookingTime: number;
  }>;
}

const mapType = (raw: string): Notification["type"] => {
  if (raw.startsWith("ml-recipe")) return "ml-recipe";
  if (raw.includes("expir")) return "expiry";
  if (raw.includes("recipe")) return "recipe";
  if (raw.includes("community")) return "community";
  if (raw.includes("achiev")) return "achievement";
  return "system";
};

const decorateTitle = (rawType: string, title: string) => {
  if (rawType.startsWith("ml-")) return `🤖 ${title}`;
  return title;
};

const actionFor = (type: Notification["type"], t: (key: string, fallback?: string) => string) => {
  switch (type) {
    case "expiry":
    case "ml-recipe":
      return { label: t("pages.notifications.findRecipes", "Find Recipes"), path: "/recipes" };
    case "recipe":
      return { label: t("pages.notifications.viewRecipe", "View Recipe"), path: "/recipes" };
    case "community":
      return { label: t("pages.notifications.viewListing", "View Listing"), path: "/community" };
    case "achievement":
      return { label: t("pages.notifications.viewProfile", "View Profile"), path: "/profile" };
    default:
      return undefined;
  }
};

// Ephemeral IDs are NOT persisted on the backend:
// - "expiry-..."  — generated locally from inventory state
// - "ml-recipe-..." — ephemeral suggestions from ML service
const isEphemeral = (id: string) =>
  id.startsWith("expiry-") || id.startsWith("ml-recipe-");

const typeIcons: Record<Notification["type"], React.ReactNode> = {
  expiry: <Clock className="w-5 h-5" />,
  recipe: <ChefHat className="w-5 h-5" />,
  community: <Users className="w-5 h-5" />,
  achievement: <Trophy className="w-5 h-5" />,
  system: <Bell className="w-5 h-5" />,
  "ml-recipe": <Sparkles className="w-5 h-5" />,
};

const typeColors: Record<Notification["type"], string> = {
  expiry: "bg-amber-100 text-amber-600",
  recipe: "bg-[#B2D2A4]/30 text-[#4A5568]",
  community: "bg-blue-100 text-blue-600",
  achievement: "bg-purple-100 text-purple-600",
  system: "bg-gray-100 text-gray-500",
  "ml-recipe": "bg-emerald-100 text-emerald-600",
};

export function Notifications() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { notifications: list } = await api.notifications();
      const mapped: Notification[] = list.map((n: NotificationDTO) => {
        const uiType = mapType(n.type);
        const action = actionFor(uiType, t);
        return {
          id: n.id,
          type: uiType,
          title: decorateTitle(n.type, n.title),
          message: n.body,
          time: timeAgo(n.createdAt || new Date().toISOString(), t),
          read: !!n.read,
          actionLabel: action?.label,
          actionPath: action?.path,
          // ML fields
          canonicalName: n.canonicalName,
          daysToExpiry: n.daysToExpiry,
          recipes: n.recipes,
        };
      });
      setNotifications(mapped);
    } catch (err: any) {
      console.error("[notifications] load failed:", err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    if (!isEphemeral(id)) {
      try {
        await api.markNotificationRead(id);
      } catch {
        /* ignore */
      }
    }
  };

  const markAllRead = async () => {
    const toMark = notifications.filter((n) => !n.read);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success(t("pages.notifications.allReadToast", "All notifications marked as read"));
    await Promise.all(
      toMark
        .filter((n) => !isEphemeral(n.id))
        .map((n) => api.markNotificationRead(n.id).catch(() => null))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
    toast.success(t("pages.notifications.clearedToast", "All notifications cleared"));
  };

  const filtered = notifications.filter((n) => filter === "all" || !n.read);

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <BottomNav />
      <main className="lg:ml-64 pb-20 lg:pb-6">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-bold tracking-tight text-[#2D3748]">{t("pages.notifications.title")}</h2>
          {unreadCount > 0 && (
            <Badge className="bg-[#B2D2A4] text-[#2D3748] hover:bg-[#B2D2A4]">
              {unreadCount} {t("pages.notifications.new", "new")}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead}>
              {t("pages.notifications.markAllRead", "Mark all read")}
            </Button>
          )}
          {notifications.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearAll}>
              {t("pages.notifications.clearAll", "Clear all")}
            </Button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
          className={filter === "all" ? "bg-[#2D3748]" : ""}
        >
          {t("pages.notifications.all")}
        </Button>
        <Button
          variant={filter === "unread" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("unread")}
          className={filter === "unread" ? "bg-[#2D3748]" : ""}
        >
          {t("pages.notifications.unread")} ({unreadCount})
        </Button>
      </div>

      {/* Notifications list */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-[#718096]">
            <div className="animate-spin w-6 h-6 border-2 border-[#B2D2A4] border-t-transparent rounded-full mx-auto mb-3" />
            {t("pages.notifications.loading", "Loading notifications...")}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-[#E2E8F0] mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-[#2D3748] mb-1">
              {filter === "unread" ? t("pages.notifications.noUnread", "No unread notifications") : t("pages.notifications.noNotifications", "No notifications yet")}
            </h3>
            <p className="text-sm text-[#718096]">
              {filter === "unread"
                ? t("pages.notifications.caughtUp", "You're all caught up!")
                : t("pages.notifications.addItemsHint", "Add items to your pantry — alerts about expiring food will appear here automatically")}
            </p>
          </div>
        ) : (
          filtered.map((notification) => (
            <div
              key={notification.id}
              className={`group bg-white rounded-xl border p-4 transition-all hover:shadow-md ${
                notification.read
                  ? "border-[#E2E8F0]"
                  : "border-[#B2D2A4]/50 bg-[#F7FAFC]"
              }`}
              onClick={() => markRead(notification.id)}
            >
              <div className="flex items-start gap-4">
                {/* Type icon */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    typeColors[notification.type]
                  }`}
                >
                  {typeIcons[notification.type]}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-[#2D3748] text-sm">
                        {notification.title}
                        {!notification.read && (
                          <span className="ml-2 w-2 h-2 bg-[#B2D2A4] rounded-full inline-block" />
                        )}
                      </h4>
                      <p className="text-xs text-[#718096] mt-0.5">{notification.time}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                    >
                      <X className="w-4 h-4 text-[#718096]" />
                    </Button>
                  </div>

                  <p className="text-sm text-[#4A5568] mt-1">{notification.message}</p>

                  {/* ── ML Recipe Suggestions Block ── */}
                  {(notification.type === "ml-recipe" || notification.type === "expiry") &&
                    notification.recipes &&
                    notification.recipes.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-semibold text-[#2D3748] flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-emerald-500" />
                          {t("pages.notifications.suggestedFor", "Suggested recipes for")}{" "}
                          {notification.canonicalName || t("pages.notifications.yourItem", "your item")}
                          {notification.daysToExpiry !== undefined && (
                            <Badge variant="outline" className="text-amber-600 border-amber-200 text-[10px] ml-1">
                              {notification.daysToExpiry === 0
                                ? t("pages.notifications.expiresToday", "expires today")
                                : `${notification.daysToExpiry}${t("pages.notifications.daysLeft", "d left")}`}
                            </Badge>
                          )}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {notification.recipes.slice(0, 3).map((recipe) => (
                            <div
                              key={recipe.id}
                              className="flex items-center gap-2 p-2 rounded-lg border border-[#E2E8F0] hover:border-[#B2D2A4] hover:bg-[#F7FAFC] cursor-pointer transition-all"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate("/recipes");
                              }}
                            >
                              <img
                                src={recipe.image}
                                alt={recipe.name}
                                className="w-12 h-12 rounded-lg object-cover shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-[#2D3748] truncate">
                                  {recipe.name}
                                </p>
                                <div className="flex items-center gap-2 text-[10px] text-[#718096]">
                                  <span className="flex items-center gap-0.5">
                                    <Star className="w-3 h-3 text-[#B2D2A4]" />
                                    {recipe.matchPercentage}%
                                  </span>
                                  <span>⏱ {recipe.cookingTime}m</span>
                                </div>
                              </div>
                              <ArrowRight className="w-4 h-4 text-[#718096] shrink-0 ml-auto" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {notification.actionLabel && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 text-[#B2D2A4] hover:text-[#2D3748] hover:bg-[#B2D2A4]/10 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (notification.actionPath) navigate(notification.actionPath);
                      }}
                    >
                      {notification.actionLabel}
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick settings link */}
      {notifications.length > 0 && (
        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-[#718096] hover:text-[#2D3748]"
            onClick={() => navigate("/profile")}
          >
            <Settings className="w-4 h-4 mr-2" />
            {t("pages.notifications.settings", "Notification settings")}
          </Button>
        </div>
      )}
        </div>
      </main>
    </div>
  );
}

function timeAgo(dateStr: string, t: (key: string, fallback?: string) => string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return t("pages.notifications.justNow", "Just now");
  if (diff < 3600) return `${Math.floor(diff / 60)} ${t("pages.notifications.minutesAgo", "m ago")}`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ${t("pages.notifications.hoursAgo", "h ago")}`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} ${t("pages.notifications.daysAgo", "d ago")}`;
  return date.toLocaleDateString();
}
