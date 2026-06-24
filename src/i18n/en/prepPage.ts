const prepPage = {
  title: "📚 Prep",
  sub: "DS sprint: polish stats/experimentation (core strength) · invest heavily in product sense · keep SQL warm · find referrals in parallel.",
  sprintTitle: "🏃 Sprint progress (checkbox tally)",
  sprintNotePre: "Update the checkboxes in ",
  sprintNotePost: " (any session can edit and push; this refreshes automatically).",
  materials: "📂 Prep materials",
  companyNotes: (n: number) => `🗒 Company interview notes (${n} companies)`,
  sprintFullText: "📋 sprint-plan.md full text",
  sprintFullHint: "When you have tokens, the checkboxes are clickable",
  links: {
    questionBank: "🏋️ Question bank (smoother on the practice page → /practice)",
    readme: "Prep overview (incl. the 4-step \"prep with AI\" method)",
    sprintPlan: "🏃 2–3 week sprint plan (6/3–6/23)",
    mockBank: "Mock question bank + self-assessment",
    companySpecific: "Company-specific topics",
    powerVariance: "Cheatsheet · Power & Variance",
    causalInference: "Cheatsheet · Causal inference",
    abtestPitfalls: "Cheatsheet · A/B test pitfalls",
    modelExplain: "Cheatsheet · Model explanation",
    defineMetrics: "Product sense · Define-metrics practice",
    diagnoseRatio: "Product sense · Ratio-metric diagnosis framework",
    marketplaceMetrics: "Product sense · Marketplace metrics",
    sqlWarmup: "SQL/Python warmup problems",
  },
};

export default prepPage;
