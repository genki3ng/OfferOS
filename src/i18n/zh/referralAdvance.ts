const referralAdvance = {
  daysBadge: (n: number) => `${n} 天`,
  daysBadgeTitle: "超过 3 天，考虑催/换渠道",
  busy: "…",
  advanceTo: (next: string) => `→ ${next}`,
  advanceTitle: (next: string) => `推进到「${next}」并盖今天日期`,
  failed: "失败",
  errMark: "✗",
};

export default referralAdvance;
