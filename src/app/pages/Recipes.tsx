import React, { useState, useEffect, useCallback } from 'react';
import { useFoodMood } from '../context/FoodMoodContext';
import { api, RecipeFeedbackAction } from '../../lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Sparkles, ChefHat, X, Star, TrendingUp, Heart, ThumbsDown } from 'lucide-react';
import { toast } from 'sonner';
import { formatPersonalRankLabel, personalRankPercent } from '../../lib/mlFormat';
import { Sidebar } from "../components/Sidebar";
import { BottomNav } from "../components/BottomNav";
import { useLanguage } from "../context/LanguageContext";

export function Recipes() {
  const { recipes, recommendationsInfo, useRecipe, setRecipePreference } = useFoodMood();
  const { t } = useLanguage();
  const [selectedRecipe, setSelectedRecipe] = useState<(typeof recipes)[0] | null>(null);
  const [cookingRecipe, setCookingRecipe] = useState<string | null>(null);

  const source = recommendationsInfo?.source || 'fallback';
  const meta = recommendationsInfo?.meta;
  const isML = source === 'ml';
  const personalizationApplied = meta?.personalizationApplied ?? false;

  const sendFeedback = useCallback(
    async (recipe: (typeof recipes)[0], action: RecipeFeedbackAction) => {
      try {
        await api.sendRecipeFeedback({
          recipeId: recipe.id,
          action,
          source,
          personalRank: recipe.personalRank,
          matchPercentage: recipe.matchPercentage,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        console.error('[Recipes] feedback failed:', err);
      }
    },
    [source]
  );

  useEffect(() => {
    if (selectedRecipe) {
      sendFeedback(selectedRecipe, 'view');
    }
  }, [selectedRecipe, sendFeedback]);

  const handleCook = async (recipe: (typeof recipes)[0]) => {
    setCookingRecipe(recipe.id);
    try {
      await useRecipe(recipe.id);
      await sendFeedback(recipe, 'cooked');
      toast.success(`${recipe.name}: ${t("pages.recipes.cookedToast", "Ingredients consumed.")}`);
      setSelectedRecipe(null);
    } catch (err: any) {
      toast.error(err.message || t("pages.recipes.useFailed", "Failed to use recipe"));
    } finally {
      setCookingRecipe(null);
    }
  };

  const handleCloseModal = () => {
    setSelectedRecipe(null);
  };

  const toggleLike = async (recipe: (typeof recipes)[0], e: React.MouseEvent) => {
    e.stopPropagation();
    const next = recipe.userPreference === 'liked' ? null : 'liked';
    try {
      await setRecipePreference(recipe.id, next);
      toast.success(next === 'liked' ? t("pages.recipes.savedToLikes", "Saved to your likes") : t("pages.recipes.removedFromLikes", "Removed from likes"));
      if (selectedRecipe?.id === recipe.id) {
        setSelectedRecipe({ ...recipe, userPreference: next ?? undefined });
      }
    } catch {
      toast.error(t("pages.recipes.preferenceFailed", "Could not save preference"));
    }
  };

  const markDisliked = async (recipe: (typeof recipes)[0], e: React.MouseEvent) => {
    e.stopPropagation();
    const next = recipe.userPreference === 'disliked' ? null : 'disliked';
    try {
      await setRecipePreference(recipe.id, next);
      toast.message(next === 'disliked' ? t("pages.recipes.fewerLikeThis", "We will show fewer recipes like this") : t("pages.recipes.preferenceCleared", "Preference cleared"));
      if (selectedRecipe?.id === recipe.id && next === 'disliked') {
        setSelectedRecipe(null);
      } else if (selectedRecipe?.id === recipe.id) {
        setSelectedRecipe({ ...recipe, userPreference: next ?? undefined });
      }
    } catch {
      toast.error(t("pages.recipes.preferenceFailed", "Could not save preference"));
    }
  };

  const displayRecipes = [...recipes].sort((a, b) => {
    const ra = personalRankPercent(a.personalRank);
    const rb = personalRankPercent(b.personalRank);
    if (isML && ra != null && rb != null) {
      return rb - ra;
    }
    if (a.userPreference === 'liked' && b.userPreference !== 'liked') return -1;
    if (b.userPreference === 'liked' && a.userPreference !== 'liked') return 1;
    return 0;
  });

  const PreferenceBadge = ({ pref }: { pref?: 'liked' | 'disliked' }) => {
    if (pref === 'liked') {
      return (
        <Badge className="bg-rose-100 text-rose-700 border-rose-200 text-xs">
          <Heart className="w-3 h-3 mr-1 fill-current" />
          {t("pages.recipes.liked", "Liked")}
        </Badge>
      );
    }
    if (pref === 'disliked') {
      return (
        <Badge className="bg-slate-100 text-slate-600 border-slate-200 text-xs">
          <ThumbsDown className="w-3 h-3 mr-1" />
          {t("pages.recipes.notForMe", "Not for me")}
        </Badge>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <BottomNav />
      <main className="lg:ml-64 pb-20 lg:pb-6">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-[#2D3748]">
              {isML ? t("pages.recipes.titleSmart") : t("pages.recipes.title")}
            </h1>
            <p className="text-[#718096]">
              {isML && personalizationApplied
                ? t("pages.recipes.subtitleAi", "Like or dismiss recipes — the AI learns your taste")
                : t("pages.recipes.subtitle", "Recipes matched to your pantry to help reduce waste")}
            </p>

            {isML && !personalizationApplied && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-2 text-sm text-amber-700">
                <TrendingUp className="w-4 h-4" />
                <span>
                  {meta?.personalizationDisabledReason
                    ? meta.personalizationDisabledReason
                    : t("pages.recipes.warmingUp", "Personalization warming up — keep liking recipes to train the model")}
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayRecipes.map((recipe) => (
              <div
                key={recipe.id}
                className={`group bg-white rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md ${
                  recipe.userPreference === 'liked'
                    ? 'border-rose-200 ring-1 ring-rose-100'
                    : recipe.userPreference === 'disliked'
                      ? 'border-slate-200 opacity-75'
                      : 'border-[#E2E8F0] hover:border-[#B2D2A4]'
                }`}
                onClick={() => setSelectedRecipe(recipe)}
              >
                <div className="relative mb-3">
                  <img
                    src={recipe.image}
                    alt={recipe.name}
                    className="w-full h-40 object-cover rounded-lg"
                  />
                  <div className="absolute top-2 left-2 flex gap-1">
                    <button
                      type="button"
                      aria-label={recipe.userPreference === 'liked' ? t("pages.recipes.unlike", "Unlike") : t("pages.recipes.likeRecipe", "Like recipe")}
                      onClick={(e) => toggleLike(recipe, e)}
                      className={`p-2 rounded-full shadow-md transition-colors ${
                        recipe.userPreference === 'liked'
                          ? 'bg-rose-500 text-white'
                          : 'bg-white/90 text-rose-500 hover:bg-rose-50'
                      }`}
                    >
                      <Heart
                        className={`w-4 h-4 ${recipe.userPreference === 'liked' ? 'fill-current' : ''}`}
                      />
                    </button>
                    <button
                      type="button"
                      aria-label={t("pages.recipes.notForMe", "Not for me")}
                      onClick={(e) => markDisliked(recipe, e)}
                      className={`p-2 rounded-full shadow-md transition-colors ${
                        recipe.userPreference === 'disliked'
                          ? 'bg-slate-600 text-white'
                          : 'bg-white/90 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      <ThumbsDown className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                    <Badge className="bg-[#B2D2A4] text-[#2D3748] hover:bg-[#B2D2A4]">
                      {recipe.matchPercentage}% {t("pages.recipes.match", "Match")}
                    </Badge>
                    <PreferenceBadge pref={recipe.userPreference} />
                    {isML && personalizationApplied && (
                      <Badge variant="outline" className="bg-white/90 text-emerald-700 border-emerald-200 text-xs">
                        <Sparkles className="w-3 h-3 mr-1" />
                        {t("pages.recipes.personalized", "Personalized")}
                      </Badge>
                    )}
                    {personalRankPercent(recipe.personalRank) != null && (
                      <Badge variant="outline" className="bg-white/90 text-indigo-600 border-indigo-200 text-xs">
                        <Star className="w-3 h-3 mr-1" />
                        {t("pages.recipes.relevance", "Relevance")} {formatPersonalRankLabel(recipe.personalRank)}
                      </Badge>
                    )}
                  </div>
                </div>

                {isML && recipe.mlInsight && (
                  <div className="mb-3 px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-md text-xs text-indigo-700 font-medium flex items-start gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5 text-indigo-500" />
                    <span>{recipe.mlInsight}</span>
                  </div>
                )}
                <h3 className="font-semibold text-[#2D3748] mb-1">{recipe.name}</h3>
                <div className="flex items-center gap-3 text-sm text-[#718096]">
                  <span>⏱ {recipe.cookingTime} {t("pages.recipes.min", "min")}</span>
                  <span>{recipe.servings} {t("pages.recipes.servings", "servings")}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {recipe.ingredients.slice(0, 3).map((ingredient, i) => (
                    <span
                      key={i}
                      className={`text-xs px-2 py-1 rounded-full ${
                        ingredient.inPantry
                          ? 'bg-[#B2D2A4]/20 text-[#2D3748]'
                          : 'bg-[#E2E8F0] text-[#718096]'
                      }`}
                    >
                      {ingredient.inPantry && <span className="mr-1">✓</span>}
                      {ingredient.name}
                    </span>
                  ))}
                  {recipe.ingredients.length > 3 && (
                    <span className="text-xs px-2 py-1 rounded-full bg-[#E2E8F0] text-[#718096]">
                      +{recipe.ingredients.length - 3} {t("pages.recipes.more", "more")}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Dialog open={!!selectedRecipe} onOpenChange={(open) => !open && handleCloseModal()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex flex-wrap items-center gap-2">
                  {selectedRecipe?.name}
                  {selectedRecipe && <PreferenceBadge pref={selectedRecipe.userPreference} />}
                  {isML && personalizationApplied && (
                    <Badge variant="outline" className="text-emerald-700 border-emerald-200">
                      <Sparkles className="w-3 h-3 mr-1" />
                      {t("pages.recipes.personalizedPick", "Personalized Pick")}
                    </Badge>
                  )}
                </DialogTitle>
              </DialogHeader>
              {selectedRecipe && (
                <>
                  <div className="relative mb-4">
                    <img
                      src={selectedRecipe.image}
                      alt={selectedRecipe.name}
                      className="w-full h-56 object-cover rounded-lg"
                    />
                    <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                      <Badge className="bg-[#B2D2A4] text-[#2D3748]">
                          {selectedRecipe.matchPercentage}% {t("pages.recipes.match", "Match")}
                      </Badge>
                      {personalRankPercent(selectedRecipe.personalRank) != null && (
                        <Badge variant="outline" className="bg-white/90 text-indigo-600 border-indigo-200">
                          <Star className="w-3 h-3 mr-1" />
                          {t("pages.recipes.relevanceForYou", "Relevance for you:")} {formatPersonalRankLabel(selectedRecipe.personalRank)}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {isML && selectedRecipe.mlInsight && (
                    <div className="mb-4 px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-lg text-sm text-indigo-800 font-medium flex items-center gap-2 shadow-sm">
                      <Sparkles className="w-5 h-5 text-indigo-500" />
                      <span><strong>{t("pages.recipes.mlInsight", "ML Insight:")}</strong> {selectedRecipe.mlInsight}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm text-[#718096] mb-4">
                    <span>⏱ {selectedRecipe.cookingTime} {t("pages.recipes.minutes", "minutes")}</span>
                    <span>{selectedRecipe.servings} {t("pages.recipes.servings", "servings")}</span>
                  </div>

                  <div className="flex gap-2 mb-4">
                    <Button
                      variant="outline"
                      onClick={(e) => toggleLike(selectedRecipe, e)}
                      className={
                        selectedRecipe.userPreference === 'liked'
                          ? 'border-rose-300 text-rose-600 bg-rose-50'
                          : ''
                      }
                    >
                      <Heart
                        className={`w-4 h-4 mr-2 ${selectedRecipe.userPreference === 'liked' ? 'fill-current' : ''}`}
                      />
                      {selectedRecipe.userPreference === 'liked' ? t("pages.recipes.liked", "Liked") : t("pages.recipes.like", "Like")}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={(e) => markDisliked(selectedRecipe, e)}
                      className={
                        selectedRecipe.userPreference === 'disliked'
                          ? 'border-slate-400 text-slate-700 bg-slate-50'
                          : ''
                      }
                    >
                      <ThumbsDown className="w-4 h-4 mr-2" />
                      {t("pages.recipes.notForMe", "Not for me")}
                    </Button>
                  </div>

                  <div className="mb-4">
                    <h3 className="font-semibold text-[#2D3748] mb-2">{t("pages.recipes.ingredients", "Ingredients")}</h3>
                    <div className="space-y-2">
                      {selectedRecipe.ingredients.map((ingredient, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 rounded-lg bg-[#F7FAFC]"
                        >
                          <div className="flex items-center gap-2">
                            {ingredient.inPantry ? (
                              <span className="text-[#B2D2A4]">✓</span>
                            ) : (
                              <span className="text-[#E2E8F0]">○</span>
                            )}
                            <span className={ingredient.inPantry ? '' : 'text-[#718096]'}>
                              {ingredient.name}
                            </span>
                          </div>
                          <span className="text-sm text-[#718096]">{ingredient.amount}</span>
                          {!ingredient.inPantry && (
                            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                              {t("pages.recipes.missing", "Missing")}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <h3 className="font-semibold text-[#2D3748] mb-2">{t("pages.recipes.instructions", "Instructions")}</h3>
                    <ol className="space-y-2">
                      {selectedRecipe.instructions.map((instruction, index) => (
                        <li key={index} className="flex gap-3">
                          <span className="shrink-0 w-6 h-6 rounded-full bg-[#B2D2A4] text-[#2D3748] flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </span>
                          <span className="text-[#4A5568]">{instruction}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleCook(selectedRecipe)}
                      disabled={cookingRecipe === selectedRecipe.id}
                      className="flex-1 bg-[#B2D2A4] hover:bg-[#9BC08A] text-[#2D3748]"
                    >
                      <ChefHat className="w-4 h-4 mr-2" />
                      {cookingRecipe === selectedRecipe.id ? t("pages.recipes.cooking", "Cooking...") : t("pages.recipes.cooked", "I Cooked This!")}
                    </Button>
                    <Button variant="outline" onClick={handleCloseModal} className="border-[#E2E8F0]">
                      <X className="w-4 h-4 mr-2" />
                      {t("pages.recipes.close", "Close")}
                    </Button>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}
