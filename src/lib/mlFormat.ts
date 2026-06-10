/**
 * personalRank: API should send 0–100; legacy ML responses may use 0–1 probability.
 * UI always shows a rounded integer percent.
 */
export function personalRankPercent(rank: number | null | undefined): number | null {
  if (rank == null || Number.isNaN(rank)) return null;
  const pct = rank <= 1 ? rank * 100 : rank;
  return Math.round(Math.min(100, Math.max(0, pct)));
}

export function formatPersonalRankLabel(rank: number | null | undefined): string {
  const pct = personalRankPercent(rank);
  return pct == null ? '' : `${pct}%`;
}
