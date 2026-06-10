import { useCallback } from "react";
import { api, RecipeFeedbackAction } from "../lib/api";

/**
 * Hook for sending recipe feedback to the ML training loop.
 * Use this in any component where users interact with recipes.
 *
 * Example:
 *   const { sendFeedback } = useRecipeFeedback("ml");
 *   sendFeedback(recipeId, "view");
 */
export function useRecipeFeedback(source: string) {
  const sendFeedback = useCallback(
    async (recipeId: string, action: RecipeFeedbackAction, metadata?: Record<string, any>) => {
      try {
        await api.sendRecipeFeedback({
          recipeId,
          action,
          source,
          timestamp: new Date().toISOString(),
          metadata,
        });
      } catch (err) {
        // Feedback is best-effort; never block the user
        console.error("[useRecipeFeedback] failed:", err);
      }
    },
    [source]
  );

  return { sendFeedback };
}