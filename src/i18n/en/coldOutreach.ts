const coldOutreach = {
  pillSearching: "🔍 Finding people on LinkedIn",
  pillFriend: "🤝 Asking a contact",
  pillGiveup: "✖️ Dropped · applying direct",

  solveBtn: "🧭 Solve",
  modalTitle: (name: string) => `🧭 ${name} · How to get a referral`,
  close: "Close",

  chipLinkedin: "🔍 Find a stranger on LinkedIn",
  chipFriend: "🤝 Ask someone you know",
  chipGiveup: "✖️ Skip the referral",

  intro:
    "Pick a path: cold outreach on LinkedIn (find a DS at the company, send a connection request + DM), ask someone you know (script ready), or skip the referral and apply online directly. Once you choose, the strategy gets written to the tracker so you can see progress in the gaps list.",

  searchBtn: (name: string) => `① Search LinkedIn for DS at ${name} →`,
  searchHint: "Prioritize: DS in the same area > same school/community > Chinese-speaking; pick 2–3 people, don't mass-message",

  jobPickHeading: "Which role to pitch (1 recommended, 📌 pre-selected):",

  connectLabel: "② Connection request (≤300 chars)",
  dmLabel: "③ DM after they accept",
  markSearching: "④ Mark as 🔍 finding people",
  noteSearching: "Marked as finding people on LinkedIn",

  friendLabel: "Script (EN + ZH, delete the part you don't need)",
  friendHint: "After sending, remember the three essentials: resume PDF + JD link + third-person bio.",
  markFriend: "Mark as 🤝 referral in progress",
  noteFriend: "Marked as referral in progress",

  giveupText:
    "Skipping the referral means applying directly on the company site (referred candidates get ~3–5x higher response rates — are you sure?). After marking, the company stays in the gaps list showing ✖️, and you can switch strategies anytime if you change your mind.",
  markGiveup: "Confirm ✖️ skip referral",
  noteGiveup: "Marked as skipped, applying direct",

  needTokenTitle: "Set up a token in ⚙️ Settings to enable writing",
  copy: "Copy",
  copied: "✓ Copied",
  copyFail: "✗",

  writing: "Writing to tracker…",
  writeOk: (note: string) => `✓ ${note} (written to the tracker, site updates in about a minute)`,
  writeFail: (err: string) => `✗ ${err}`,
  writeFailDefault: "Write failed",
};

export default coldOutreach;
