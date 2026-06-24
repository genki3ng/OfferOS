const pipeline = {
  title: "🏢 Companies (pipeline)",
  subPre: "View each company by ",
  subStage: "journey stage",
  subPost: " (no longer a single table) — see at a glance who's advancing, who's stuck, and whose court the ball is in. Edit status and mark application progress right on the card. Source file:",
  subBadge: ". Badges ",
  subBadgeTail: " = how much you want it.",
  stageOffer: "Offer · negotiation",
  stageInterview: "Interviewing",
  stageRecruiter: "Recruiter call / screen",
  stageSubmitted: "Applied · referral",
  stageWatching: "Watching · tracking",
  count: (n: number) => `${n}`,
  careersTitle: "Official careers page",
  referral: "Referral",
  legend:
    "Symbols: 🟢 friendly · 🟡 to confirm / reserved · 🔴 risk · 👑 day-1 PERM · ✅ confirmed. Cards are auto-sorted into stages by status (they re-sort on the next rebuild after a status change).",
};

export default pipeline;
