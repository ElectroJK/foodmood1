// Drop this file into the frontend at: src/lib/api.ts
//
// It provides a typed thin wrapper around the backend. The interfaces re-use
// the same names already declared in src/app/context/FoodMoodContext.tsx so the
// rest of the app needs zero changes.

const env = (import.meta as any).env || {};
const BASE_URL = env.VITE_API_URL || (env.PROD ? '' : 'http://localhost:4000');
const TOKEN_KEY = 'foodmood_token';

// Event name dispatched on every token change in the current tab.
// FoodMoodContext listens to this and re-fetches or resets its state, since
// the browser's native `storage` event only fires in OTHER tabs.
export const AUTH_EVENT = 'foodmood:auth-changed';

export const auth = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (t: string | null) => {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
    // Notify same-tab listeners (login on tab A should refresh tab A too).
    try {
      window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: { token: t } }));
    } catch {
      /* SSR / very old browser — silently ignore */
    }
  },
  isAuthenticated: () => !!localStorage.getItem(TOKEN_KEY),
};

// Single in-flight refresh promise — prevents N concurrent requests from
// firing N parallel /refresh calls when the access token expires.
let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // send the httpOnly refresh cookie
      });
      if (!res.ok) return null;
      const data = await res.json();
      const newToken = data?.accessToken || data?.token || null;
      if (newToken) auth.setToken(newToken);
      return newToken;
    } catch {
      return null;
    } finally {
      // Allow the next failed request to trigger a fresh refresh attempt.
      setTimeout(() => { refreshInFlight = null; }, 0);
    }
  })();
  return refreshInFlight;
}

async function doFetch(path: string, init: RequestInit, token: string | null): Promise<Response> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(init.headers as Record<string, string>),
  };
  if (!(init.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) headers['Authorization'] = `Bearer ${token}`;
  // credentials:'include' lets the browser attach the httpOnly refresh cookie.
  return fetch(`${BASE_URL}${path}`, { ...init, headers, credentials: 'include' });
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res = await doFetch(path, init, auth.getToken());

  // 401 on a protected route → try a silent refresh, then retry once.
  // We skip retrying on auth endpoints themselves to avoid loops.
  if (res.status === 401 && !path.startsWith('/api/auth/')) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await doFetch(path, init, newToken);
    }
  }

  if (!res.ok) {
    let body: any = null;
    try { body = await res.json(); } catch {}
    throw Object.assign(new Error(body?.error || `HTTP ${res.status}`), { status: res.status, body });
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

// ───── Types — mirror backend DTOs ─────
export interface UserDTO {
  id: string; name: string; email: string; role: string;
  stats: { foodSavedKg: number; co2Offset: number; moneySaved: number; wasteWarriorLevel: number };
}
export interface FoodItemDTO {
  id: string; name: string; category: string; quantity: number; unit: string;
  price: number; expiryDate: string; addedDate: string; image?: string; status?: string;
}

// ───── Recipe DTOs with ML fields ─────
export interface RecipeIngredientDTO {
  name: string; amount: string; inPantry: boolean;
}

export type RecipeUserPreference = 'liked' | 'disliked';

export interface RecipeDTO {
  id: string;
  name: string;
  matchPercentage: number;
  cookingTime: number;
  servings: number;
  ingredients: RecipeIngredientDTO[];
  instructions: string[];
  image: string;
  /** ML-only: personal relevance score (0-100). Higher = more relevant for this user. */
  personalRank?: number;
  mlInsight?: string;
  /** Saved taste from like / dismiss actions */
  userPreference?: RecipeUserPreference;
}

/** Metadata about how recommendations were generated. */
export interface RecommendMetaDTO {
  /** true if ML personalization was actually applied to this result set */
  personalizationApplied: boolean;
  /** Optional human-readable reason when personalization is off */
  personalizationDisabledReason?: string;
  /** ML model version or backend strategy identifier */
  modelVersion?: string;
  /** Timestamp of generation */
  generatedAt?: string;
  /** Any extra debug/analytics fields */
  [key: string]: any;
}

export interface RecommendRecipesResponseDTO {
  recipes: RecipeDTO[];
  /** Source of recommendations: 'ml' | 'rule' | 'popular' | 'fallback' */
  source: string;
  /** Metadata about generation */
  meta: RecommendMetaDTO;
  /** recipeId -> liked | disliked */
  preferences?: Record<string, RecipeUserPreference>;
}

export interface CommunityListingDTO {
  id: string; itemName: string; quantity: string; userName: string;
  image?: string; lat: number; lng: number; distance?: string; status?: string;
}
export interface ScannedItemDTO {
  name: string; price: string; expiryDate: string; confidence: number;
}

// ───── Extended Notification DTOs for ML responses ─────
export interface NotificationRecipePayloadDTO {
  id: string;
  name: string;
  image: string;
  matchPercentage: number;
  cookingTime: number;
  urgentIngredientsUsed?: string[];
  personalRank?: number;
  mlInsight?: string;
}

export interface NotificationDTO {
  id: string;
  type: string;
  title: string;
  body: string;
  payload?: any;
  read: boolean;
  createdAt: string;
  // ── ML-specific fields ──
  /** Canonical name of the expiring item (for expiry alerts from ML) */
  canonicalName?: string;
  /** Days until expiry */
  daysToExpiry?: number;
  /** Suggested recipes when ML sends a smart expiry alert */
  recipes?: NotificationRecipePayloadDTO[];
}

// ───── Feedback DTO for ML learning loop ─────
export type RecipeFeedbackAction =
  | 'view'
  | 'cooked'
  | 'dismissed'
  | 'like'
  | 'liked'
  | 'unliked'
  | 'clear';

export interface RecipeFeedbackDTO {
  recipeId: string;
  action: RecipeFeedbackAction;
  source?: string;
  timestamp?: string;
  scoreShown?: number;
  personalRank?: number;
  matchPercentage?: number;
}

// ───── API surface ─────
export const api = {
  // Auth
  register: (body: { name: string; email: string; password: string }) =>
    request<{ token: string; accessToken?: string; user: UserDTO }>('/api/auth/register', {
      method: 'POST', body: JSON.stringify(body),
    }).then((r) => { auth.setToken(r.accessToken || r.token); return r; }),
  login: (body: { email: string; password: string }) =>
    request<{ token: string; accessToken?: string; user: UserDTO }>('/api/auth/login', {
      method: 'POST', body: JSON.stringify(body),
    }).then((r) => { auth.setToken(r.accessToken || r.token); return r; }),
  // Sign in with the ID token Google Identity Services returned in-browser.
  googleSignIn: (idToken: string) =>
    request<{ token: string; accessToken?: string; user: UserDTO }>('/api/auth/google', {
      method: 'POST', body: JSON.stringify({ idToken }),
    }).then((r) => { auth.setToken(r.accessToken || r.token); return r; }),
  me: () => request<{ user: UserDTO }>('/api/auth/me'),
  logout: async () => {
    // Clears both the in-memory access token and the server-side httpOnly cookie.
    try { await request('/api/auth/logout', { method: 'POST' }); } catch {}
    auth.setToken(null);
  },
  verifyEmail: (token: string) =>
    request<{ ok: true; user: UserDTO }>(`/api/auth/verify-email/${encodeURIComponent(token)}`),
  resendVerification: () =>
    request<{ ok: true; alreadyVerified?: boolean }>('/api/auth/resend-verification', {
      method: 'POST',
    }),
  forgotPassword: (email: string) =>
    request<{ ok: true }>('/api/auth/forgot-password', {
      method: 'POST', body: JSON.stringify({ email }),
    }),
  resetPassword: (token: string, password: string) =>
    request<{ ok: true }>('/api/auth/reset-password', {
      method: 'POST', body: JSON.stringify({ token, password }),
    }),

  // ───── Admin (requires user.role === 'admin') ─────
  adminStats: () =>
    request<{
      totalUsers: number;
      activeUsers: number;
      bannedUsers: number;
      scansToday: number;
      co2SavedKg: number;
    }>('/api/admin/stats'),
  adminListUsers: (opts: {
    q?: string;
    status?: 'active' | 'inactive' | 'banned';
    role?: 'user' | 'admin';
    page?: number;
    limit?: number;
  } = {}) => {
    const qs = new URLSearchParams();
    if (opts.q) qs.set('q', opts.q);
    if (opts.status) qs.set('status', opts.status);
    if (opts.role) qs.set('role', opts.role);
    if (opts.page) qs.set('page', String(opts.page));
    if (opts.limit) qs.set('limit', String(opts.limit));
    const qsStr = qs.toString();
    return request<{
      users: Array<{
        id: string;
        name: string;
        email: string;
        role: 'user' | 'admin';
        status: 'active' | 'inactive' | 'banned';
        scans: number;
        registered: string;
        lastActiveAt: string;
        emailVerified: boolean;
      }>;
      total: number;
      page: number;
      limit: number;
      pages: number;
    }>(`/api/admin/users${qsStr ? '?' + qsStr : ''}`);
  },
  adminGetUser: (id: string) =>
    request<{ user: UserDTO & { scansCount: number; pantryCount: number; sharedCount: number } }>(
      `/api/admin/users/${id}`
    ),
  adminUpdateUser: (
    id: string,
    patch: { status?: 'active' | 'inactive' | 'banned'; role?: 'user' | 'admin'; name?: string }
  ) =>
    request<{ user: any }>(`/api/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),
  adminBanUser: (id: string) =>
    request<{ user: any }>(`/api/admin/users/${id}/ban`, { method: 'POST' }),
  adminUnbanUser: (id: string) =>
    request<{ user: any }>(`/api/admin/users/${id}/unban`, { method: 'POST' }),
  adminDeleteUser: (id: string) =>
    request<{ ok: true }>(`/api/admin/users/${id}`, { method: 'DELETE' }),

  // Inventory
  listInventory: () => request<{ items: FoodItemDTO[] }>('/api/inventory'),
  addItem: (item: Omit<FoodItemDTO, 'id'>) =>
    request<{ item: FoodItemDTO }>('/api/inventory', {
      method: 'POST', body: JSON.stringify(item),
    }),
  addItemsBatch: (items: Omit<FoodItemDTO, 'id'>[]) =>
    request<{ items: FoodItemDTO[] }>('/api/inventory/batch', {
      method: 'POST', body: JSON.stringify({ items }),
    }),
  updateItem: (id: string, patch: Partial<FoodItemDTO>) =>
    request<{ item: FoodItemDTO }>(`/api/inventory/${id}`, {
      method: 'PATCH', body: JSON.stringify(patch),
    }),
  removeItem: (id: string) => request<{ ok: true }>(`/api/inventory/${id}`, { method: 'DELETE' }),
  consumeItem: (id: string) =>
    request<{ item: FoodItemDTO; stats: UserDTO['stats'] }>(`/api/inventory/${id}/consume`, { method: 'POST' }),
  discardItem: (id: string) =>
    request<{ item: FoodItemDTO; stats: UserDTO['stats'] }>(`/api/inventory/${id}/discard`, { method: 'POST' }),
  shareItem: (id: string) =>
    request<{ item: FoodItemDTO; stats: UserDTO['stats'] }>(`/api/inventory/${id}/share`, { method: 'POST' }),

  // Recipes
  listRecipes: () => request<{ recipes: RecipeDTO[] }>('/api/recipes'),
  recommendRecipes: (limit = 12) =>
    request<RecommendRecipesResponseDTO>(`/api/recipes/recommend/me?limit=${limit}`),
  useRecipe: (id: string) =>
    request<{ consumed: FoodItemDTO[]; stats: UserDTO['stats'] }>(`/api/recipes/${id}/use`, { method: 'POST' }),

  // ───── ML Feedback loop ─────
  /** Send user interaction with a recipe back to the backend for ML training.
   *  The backend forwards this to /feedback on the ML service. */
  sendRecipeFeedback: (feedback: RecipeFeedbackDTO) =>
    request<{ ok: true; preference: RecipeUserPreference | null }>(
      '/api/recipes/feedback',
      {
        method: 'POST',
        body: JSON.stringify({
          ...feedback,
          timestamp: feedback.timestamp || new Date().toISOString(),
        }),
      }
    ),

  getRecipePreferences: () =>
    request<{ preferences: Record<string, RecipeUserPreference> }>(
      '/api/recipes/preferences'
    ),

  // Scanner
  scanReceipt: (file: File) => {
    const fd = new FormData();
    fd.append('image', file);
    return request<{ items: ScannedItemDTO[]; rawText: string; meanConfidence: number }>('/api/scan', {
      method: 'POST', body: fd,
    });
  },

  // Community
  listCommunity: (opts?: { lat?: number; lng?: number; radius?: number }) => {
    const q = new URLSearchParams();
    if (opts?.lat !== undefined) q.set('lat', String(opts.lat));
    if (opts?.lng !== undefined) q.set('lng', String(opts.lng));
    if (opts?.radius !== undefined) q.set('radius', String(opts.radius));
    const qs = q.toString();
    return request<{ listings: CommunityListingDTO[] }>(`/api/community${qs ? '?' + qs : ''}`);
  },
  shareToCommunity: (body: { itemName: string; quantity: string; image?: string; lat: number; lng: number }) =>
    request<{ listing: CommunityListingDTO }>('/api/community', {
      method: 'POST', body: JSON.stringify(body),
    }),
  claimCommunity: (id: string) =>
    request<{ listing: CommunityListingDTO }>(`/api/community/${id}/claim`, { method: 'POST' }),

  // Stats
  stats: () => request<{ stats: UserDTO['stats'] }>('/api/stats/me'),
  analytics: (weeks = 12) =>
    request<{ stats: UserDTO['stats']; weekly: any[]; categories: any[] }>(`/api/stats/analytics?weeks=${weeks}`),

  // Notifications
  notifications: () => request<{ notifications: NotificationDTO[] }>('/api/notifications'),
  markNotificationRead: (id: string) =>
    request<void>(`/api/notifications/${id}/read`, { method: 'POST' }),
};
