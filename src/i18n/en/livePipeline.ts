const livePipeline = {
  badgeLive: "↻ Live (reading the repo directly: status and 📌 sub-items are current; a 📌 you just clicked in /jobs shows up immediately)",
  badgeLoading: "↻ Loading live data… (falls back to the build snapshot on failure)",
  badgeSnapshot:
    "Status / 📌 are a build-time snapshot — your edits were committed instantly and sync after the ~1-minute rebuild; set up a token to make this page live",
  hintOffer: "🏆 Has offer",
  hintInterview: "🗣️ Interviewing",
  hintApplied: "📮 Applied",
  hintTitle: "Auto-hint based on the application progress of this company's 📌 roles (doesn't change your status selection)",
};

export default livePipeline;
