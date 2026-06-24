const start = {
  // Page header
  title: "🚀 Getting Started",
  sub: "Take this command center from zero to your own job-search war room — plus how you'll work with Claude day to day.",

  // "What is this" card
  whatTitle: "What is this",
  whatItem1Pre: "A ",
  whatItem1Bold: "\"you + Claude\" job-search management system",
  whatItem1Post: ": plan / prep / apply / referrals / interview / negotiate / retro — Claude helps at every step.",
  whatItem2Pre: "The ",
  whatItem2Bold: "markdown files in the repo are the database",
  whatItem2Post: "; this site is a read-only dashboard plus light interactions — the real work happens in the Claude Code conversation.",
  whatItem3Pre: "Three memory files let any new session pick up where you left off: ",
  whatItem3Mid1: " (long-term conventions) · ",
  whatItem3Mid2: " (in-progress snapshot) · ",
  whatItem3Post: " (history log).",

  // "From zero" section
  fromZeroTitle: "From zero (5 steps)",
  steps: [
    {
      t: "Get the code",
      d: "On GitHub, click \"Use this template\" or Fork to create your own private repo.",
    },
    {
      t: "Deploy to Vercel",
      d: "Connect the repo to Vercel — from then on, every push to main rebuilds and deploys automatically. Markdown is the database; there's no other backend.",
    },
    {
      t: "Add a lock",
      d: "In Vercel, set the SITE_PASSWORD environment variable (or enable Vercel Authentication) — otherwise your job-search data is publicly visible.",
    },
    {
      t: "Make it yours",
      d: "Edit src/site.config.ts: name, avatar initials, north star, your owner/repo. To edit / dispatch tasks directly on the site, also add a fine-grained PAT under ⚙️ Settings (Contents read/write for this repo only, stored locally in your browser, never committed).",
    },
    {
      t: "Fill in yourself",
      d: "Replace the fictional samples under profile/, pipeline/, and strategy/ with your real details — you can just ask Claude to write them for you.",
    },
  ],

  // "The loop" card
  loopTitle: "How you'll interact day to day (the loop)",
  loop: [
    { k: "Open", v: "Tell Claude \"read CLAUDE.md and HANDOFF.md, recap the current state\" — it instantly knows where you are." },
    { k: "Drive", v: "Just say what you need: generate SQL / stats / product-sense questions, tailor your resume per company, scan roles, draft referral emails, organize interview notes, run interview retros." },
    { k: "Board", v: "On the site, check off tasks, change company status, advance referrals in one click, 📨 dispatch tasks (written to inbox/, auto-processed next session)." },
    { k: "Close", v: "Have Claude update HANDOFF.md + add a journal entry + commit & push. Vercel rebuilds automatically and the site syncs instantly." },
    { k: "Anywhere", v: "Connect this repo at claude.ai/code — drive it from your phone or browser, no local setup needed." },
  ],

  // "Swap the samples for your own" card
  replaceTitle: "Swap the samples for your own",
  colFile: "File",
  colWhat: "What it is",
  replaceWhy: [
    "Your background and accomplishments (raw material for your resume and behavioral stories)",
    "Your north star and hard constraints (the reference for where to apply and which offer to take)",
    "Master resume — auto-exports to docx / HTML / PDF on build",
    "Your target companies and progress on each",
    "Your referral channels",
    "Question bank and notes — currently empty templates; have Claude generate them for your target companies",
  ],

  // Footer note
  footerPre: "The person in the current repo, ",
  footerMid: ", and the sample companies (Northwind / Vertex Cloud / Helios Media) are all ",
  footerBold: "fictional placeholders",
  footerPost: " — feel free to delete or change them. For more detail, see ",
  footerLink2Pre: " and ",
  footerLink2Post: ".",
};

export default start;
