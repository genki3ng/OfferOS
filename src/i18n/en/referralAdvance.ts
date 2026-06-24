const referralAdvance = {
  daysBadge: (n: number) => `${n}d`,
  daysBadgeTitle: "Over 3 days — consider a nudge or another channel",
  busy: "…",
  advanceTo: (next: string) => `→ ${next}`,
  advanceTitle: (next: string) => `Advance to "${next}" and stamp today's date`,
  failed: "Failed",
  errMark: "✗",
};

export default referralAdvance;
