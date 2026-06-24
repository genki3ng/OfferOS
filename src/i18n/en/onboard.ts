const onboard = {
  // Step names (top progress)
  steps: ["Identity", "Target role", "Level", "Location", "Visa", "Target companies", "North star", "Confirm"],

  // Work mode / visa — visible button labels
  modeRemote: "Remote",
  modeHybrid: "Hybrid",
  modeOnsite: "Onsite",
  visaNeeded: "Need sponsorship",
  visaNotNeeded: "Not needed",
  visaUnsure: "Undecided",

  // Done screen
  doneTitle: "✅ Setup complete",
  donePackPre: "We've written your identity, role (",
  donePackMid: "), and target companies into the repo, and left Claude a request to generate a ",
  donePackPost: " prep pack.",
  doneNote:
    "Vercel will rebuild and deploy within ~1 minute, and the whole site will then reflect your details. Next: in Claude Code, just say \"read CLAUDE.md and HANDOFF.md, process the inbox.\"",
  doneBackHome: "Back to Today →",

  // Wizard header
  title: "🚀 Set up OfferOS",
  subPre: "Answer a few questions to turn this template into ",
  subStrong: "your",
  subMid: " job-search command center, and pick the prep template for your role.",
  stepLabel: (cur: number, total: number, name: string) => `Step ${cur}/${total}: ${name}`,

  // Step 0 identity
  nameLabel: "Your name",
  nameHint: "Used in the homepage greeting and page copy.",
  namePlaceholder: "e.g. Jane Doe",
  initialsLabel: "Avatar initials",
  initialsHint: "Top-right avatar, 1–3 characters; leave blank to auto-derive from your name.",

  // Step 1 target role
  roleLabel: "Your target role",
  roleHint: "Drives the prep question bank, interview rounds, and north-star template.",

  // Step 2 level
  currentLevelLabel: "Current level",
  currentLevelHint: "Pick a preset or type your own.",
  currentLevelPlaceholder: "e.g. Senior (IC5)",
  targetLevelLabel: "Target level",
  targetLevelPlaceholder: "e.g. Staff (IC6)",

  // Step 3 location
  workModeLabel: "Work mode",
  regionsLabel: "Region / city preference",
  regionsHint: "Comma-separated; can be left blank.",
  regionsPlaceholder: "e.g. major US cities, Remote, Bay Area",

  // Step 4 visa
  visaLabel: "Do you need visa sponsorship?",

  // Step 5 target companies
  companiesLabel: "Target companies",
  companiesHint: "Press Enter or comma to add; these go into the tracker (pipeline). Can be left blank and added later.",
  companiesPlaceholder: "e.g. Northwind",
  companiesAdd: "Add",

  // Step 6 north star
  mottoLabel: "Greeting motto",
  mottoHint: "An encouraging line in the homepage greeting.",
  mottoPlaceholder: "Stay steady,",
  northStarLabel: "North star (one-line goal)",
  northStarHint: "Leave blank to auto-generate from the role template (see preview below).",
  northStarPreviewPrefix: "Preview: ",

  // Step last confirm
  confirmTitle: "Confirm the profile to write",
  confirmHasTokenPre: "This will commit to repo ",
  confirmHasTokenMid1: ": writing ",
  confirmHasTokenMid2: ", resetting ",
  confirmHasTokenMid3: ", rewriting ",
  confirmHasTokenPost: (shortLabel: string) =>
    `, and leaving Claude a request to generate a ${shortLabel} prep pack. Vercel rebuilds in ~1 minute.`,
  confirmWrite: "Confirm and write to repo →",
  confirmWriting: "Writing…",
  confirmNoTokenPre: "Not connected to GitHub yet (no PAT configured). Two options: (1) go to ",
  confirmNoTokenMid:
    " to set up a fine-grained PAT and come back — your answers on this page are auto-saved; or (2) hand the snippet below to Claude / Codex and have it write to the repo for you.",
  confirmCopy: "Copy for Claude / Codex",
  confirmCopied: "Copied ✓",
  confirmGoPat: "Set up a PAT →",

  // Write failure fallback
  writeFailed: "Write failed",

  // Navigation
  navPrev: "← Back",
  navNext: "Next →",
};

export default onboard;
