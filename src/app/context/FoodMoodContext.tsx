import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { api, auth, AUTH_EVENT, RecommendMetaDTO } from '../../lib/api';

export interface FoodItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  price: number;
  expiryDate: string;
  addedDate: string;
  image?: string;
}

export interface Recipe {
  id: string;
  name: string;
  matchPercentage: number;
  cookingTime: number;
  servings: number;
  ingredients: { name: string; amount: string; inPantry: boolean }[];
  instructions: string[];
  image: string;
  /** ML-only: personal relevance score (0-100) */
  personalRank?: number;
  /** ML-only: human readable insight */
  mlInsight?: string;
  userPreference?: 'liked' | 'disliked';
}

export interface CommunityListing {
  id: string;
  itemName: string;
  quantity: string;
  distance: string;
  userName: string;
  image: string;
  lat: number;
  lng: number;
}

interface UserStats {
  foodSavedKg: number;
  co2Offset: number;
  moneySaved: number;
  wasteWarriorLevel: number;
}

/** Information about the last recommendation fetch. */
export interface RecommendationsInfo {
  /** 'ml' | 'rule' | 'popular' | 'fallback' */
  source: string;
  meta: RecommendMetaDTO;
}

interface FoodMoodContextType {
  inventory: FoodItem[];
  recipes: Recipe[];
  /** Info about how the current recipe list was generated (source + meta). */
  recommendationsInfo: RecommendationsInfo | null;
  communityListings: CommunityListing[];
  userStats: UserStats;
  userName: string;
  loading: boolean;
  addItem: (item: FoodItem) => Promise<void>;
  updateItem: (id: string, updates: Partial<FoodItem>) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  consumeItem: (id: string) => Promise<void>;
  discardItem: (id: string) => Promise<void>;
  shareItem: (id: string) => Promise<void>;
  useRecipe: (recipeId: string) => Promise<void>;
  setRecipePreference: (
    recipeId: string,
    preference: 'liked' | 'disliked' | null
  ) => Promise<void>;
  refresh: () => Promise<void>;
}

const FoodMoodContext = createContext<FoodMoodContextType | undefined>(undefined);

const defaultStats: UserStats = {
  foodSavedKg: 0,
  co2Offset: 0,
  moneySaved: 0,
  wasteWarriorLevel: 1,
};

export function FoodMoodProvider({ children }: { children: ReactNode }) {
  const [inventory, setInventory] = useState<FoodItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recommendationsInfo, setRecommendationsInfo] = useState<RecommendationsInfo | null>(null);
  const [communityListings, setCommunityListings] = useState<CommunityListing[]>([]);
  const [userStats, setUserStats] = useState(defaultStats);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);

  // Reset every piece of context state to its initial value — used on logout
  // and on a same-tab account switch, to make absolutely sure no data from the
  // previous user lingers in React state.
  const resetState = useCallback(() => {
    setInventory([]);
    setRecipes([]);
    setRecommendationsInfo(null);
    setCommunityListings([]);
    setUserStats(defaultStats);
    setUserName('');
    setLoading(false);
  }, []);

  // Load everything from the backend after login.
  const refresh = useCallback(async () => {
    if (!auth.isAuthenticated()) {
      resetState();
      return;
    }
    setLoading(true);
    try {
      const [meRes, invRes, recRes, statsRes, commRes] = await Promise.all([
        api.me(),
        api.listInventory(),
        api.recommendRecipes(12),
        api.stats(),
        api.listCommunity().catch(() => ({ listings: [] })),
      ]);
      setUserName(meRes.user.name);
      setUserStats(statsRes.stats);
      setInventory(invRes.items as FoodItem[]);
      setRecipes(recRes.recipes as Recipe[]);
      setRecommendationsInfo({
        source: recRes.source || 'fallback',
        meta: recRes.meta || { personalizationApplied: false },
      });
      setCommunityListings(commRes.listings as CommunityListing[]);
    } catch (err) {
      console.error('[FoodMoodContext] refresh failed:', err);
    } finally {
      setLoading(false);
    }
  }, [resetState]);

  useEffect(() => {
    refresh();

    // Re-fetch when the token changes anywhere in the app (same tab or other).
    // The native `storage` event only fires in OTHER tabs, so we additionally
    // listen for our custom AUTH_EVENT which auth.setToken dispatches.
    const onAuthChange = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      if (detail.token === null) {
        // Explicit logout — wipe state immediately so the next render is clean.
        resetState();
      } else {
        refresh();
      }
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'foodmood_token') refresh();
    };
    window.addEventListener(AUTH_EVENT, onAuthChange);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(AUTH_EVENT, onAuthChange);
      window.removeEventListener('storage', onStorage);
    };
  }, [refresh, resetState]);

  const addItem = async (item: FoodItem) => {
    const { item: saved } = await api.addItem({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      price: item.price,
      expiryDate: item.expiryDate,
      addedDate: item.addedDate,
      image: item.image,
    } as any);
    setInventory((prev) => [...prev, saved as FoodItem]);
  };

  const updateItem = async (id: string, updates: Partial<FoodItem>) => {
    const { item: saved } = await api.updateItem(id, updates as any);
    setInventory((prev) => prev.map((i) => (i.id === id ? (saved as FoodItem) : i)));
  };

  const removeItem = async (id: string) => {
    await api.removeItem(id);
    setInventory((prev) => prev.filter((i) => i.id !== id));
  };

  const consumeItem = async (id: string) => {
    const { stats } = await api.consumeItem(id);
    setUserStats(stats);
    setInventory((prev) => prev.filter((i) => i.id !== id));
  };

  const discardItem = async (id: string) => {
    await api.discardItem(id);
    setInventory((prev) => prev.filter((i) => i.id !== id));
  };

  const shareItem = async (id: string) => {
    const { stats } = await api.shareItem(id);
    setUserStats(stats);
    setInventory((prev) => prev.filter((i) => i.id !== id));
  };

  const useRecipe = async (recipeId: string) => {
    const { stats } = await api.useRecipe(recipeId);
    setUserStats(stats);
    const { items } = await api.listInventory();
    setInventory(items as FoodItem[]);
    setRecipes((prev) =>
      prev.map((r) => (r.id === recipeId ? { ...r, userPreference: 'liked' as const } : r))
    );
  };

  const setRecipePreference = async (
    recipeId: string,
    preference: 'liked' | 'disliked' | null
  ) => {
    const recipe = recipes.find((r) => r.id === recipeId);
    await api.sendRecipeFeedback({
      recipeId,
      action:
        preference === null
          ? 'clear'
          : preference === 'liked'
            ? 'liked'
            : 'unliked',
      personalRank: recipe?.personalRank,
      matchPercentage: recipe?.matchPercentage,
    });
    setRecipes((prev) => {
      if (preference === 'disliked') {
        return prev.filter((r) => r.id !== recipeId);
      }
      return prev.map((r) =>
        r.id === recipeId
          ? { ...r, userPreference: preference ?? undefined }
          : r
      );
    });
  };

  return (
    <FoodMoodContext.Provider
      value={{
        inventory,
        recipes,
        recommendationsInfo,
        communityListings,
        userStats,
        userName,
        loading,
        addItem,
        updateItem,
        removeItem,
        consumeItem,
        discardItem,
        shareItem,
        useRecipe,
        setRecipePreference,
        refresh,
      }}
    >
      {children}
    </FoodMoodContext.Provider>
  );
}

export function useFoodMood() {
  const context = useContext(FoodMoodContext);
  if (!context) {
    throw new Error('useFoodMood must be used within FoodMoodProvider');
  }
  return context;
}
