const followup = {
  title: "Follow-up radar",
  countChase: (n: number) => `${n} to chase`,
  allClear: "All within SLA · nothing to chase",
  none: "Nothing awaiting a reply",

  // days silent + level badge
  silent: (d: number) => `${d}d silent`,
  badgeOverdue: (d: number) => `chase · ${d}d over`,
  badgeSoon: (d: number) => `due soon · ${d}d`,
  badgeOk: (d: number) => `waiting · ${d}d`,

  // what we're waiting on (sub-label)
  awaitReferred: "referred · awaiting recruiter",
  awaitApplied: "applied · awaiting recruiter",
  awaitNextRound: "awaiting next round",
  awaitConnection: "awaiting connection",

  // suggested action when overdue
  actReferred: "ask referrer to check / nudge recruiter",
  actApplied: "find a recruiter on LinkedIn, or add a warm referral",
  actNextRound: "ask recruiter to schedule the next round",
  actConnection: "swap in a backup referrer if not accepted",

  more: "All companies →",
  slaNote: "SLA: referral 14d · applied 21d · post-round 7d · connection 7d",
};

export default followup;
