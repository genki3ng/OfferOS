const jobs = {
  // page.tsx
  title: "📋 Jobs",
  sub: "Aggregated view of the “Currently open” sections across 15 pipeline companies (source = pipeline/companies/*.md; re-scraped every 2–4 weeks, so listings change).",

  // JobsTable — status messages
  submitting: "Submitting…",
  pinAdded: "📌 Added to apply list (site-wide update in ~1 min)",
  pinRemoved: "Removed from apply list",
  attLove: "💚 Marked as a good fit (site-wide update in ~1 min)",
  attNo: "🚫 Marked as not a fit",
  attCleared: "Flag cleared",
  submitFailed: "Submit failed",

  // JobsTable — filters
  searchPlaceholder: "Search role / location / keyword…",
  sortTitle: "Sort by",
  sortDefault: "Sort: default (📌→💚→tier→fit)",
  sortAtt: "Sort: flag (💚 good fit first)",
  sortFit: "Sort: fit (⭐🎯)",
  sortCo: "Sort: by company",
  sortNew: "Sort: most recently scraped",
  allTiers: "All tiers",
  tier1: "🥇 Tier 1",
  tier2: "🥈 Tier 2",
  tier3: "🥉 Tier 3",
  allCompanies: "All companies",
  onlyPinned: (n: number) => `📌 Apply list only (${n})`,
  hideNo: "🚫 Hide not-a-fit",
  includeExcluded: "Include excluded",

  // JobsTable — summary line
  summary: (count: number, pinnedCount: number, loveCount: number) =>
    `${count} roles · ⭐/🎯 = per-session scan judgment · 📌 = apply list (${pinnedCount}, **shown under the matching pipeline company, where you can track apply progress**) · 💚 = good fit (${loveCount}) / 🚫 = not a fit`,
  summaryCanWrite: "; click the inline buttons to toggle",
  summaryReadOnly: "——add a token in ⚙️ Settings to click directly",

  // JobsTable — table headers
  thAtt: "Flag",
  thAttTitle: "Flag: click to cycle undecided→💚good fit→🚫not a fit",
  thCompany: "Company",
  thFit: "Fit",
  thRole: "Role & details (original)",
  thLocation: "Location",
  thFetched: "Scraped",

  // JobsTable — data-labels (mobile card labels)
  dlList: "List",
  dlAtt: "Flag",
  dlCompany: "Company",
  dlFit: "Fit",
  dlRole: "Role",
  dlLocation: "Location",
  dlFetched: "Scraped",

  // JobsTable — pin button titles
  pinUnpinTitle: "Remove from apply list (also removes it from the pipeline company)",
  pinAddTitle:
    "📌 Add to apply list → shown under the matching pipeline company (track apply progress there); also pre-selected in the referral dialog",
  pinDisabledTitle: "Add a token in ⚙️ Settings to click",

  // JobsTable — attitude button titles
  attCycleTitle: "Click to cycle: undecided → 💚 good fit → 🚫 not a fit",
  attDisabledTitle: "Add a token in ⚙️ Settings to click",
};

export default jobs;
