const practice = {
  // page.tsx
  title: "🏋️ Practice",
  subPre: "Question bank = ",
  subMid: (n: number) => `(${n} questions) · self-ratings auto-write to `,
  subPost: " · I'll find weak spots from your records and produce reinforcement material. Flow: draw a question → speak aloud / write your solution → compare with key points → self-rate (→ optionally submit for review).",

  // GRADES labels
  gradeStuck: "😣 Stuck",
  gradeShaky: "😐 Shaky",
  gradeFluent: "😎 Fluent",

  // status messages
  msgRecordedLocal: "Recorded this self-rating (saved on this device; configure a token to persist it long-term to the practice log)",
  msgSubmitting: "Submitting…",
  msgWritten: "✓ Written to practice-log.md",
  msgFailed: "Failed",

  // chips row
  all: (n: number) => `All ${n}`,
  drawWeakFirst: "🎲 Draw a question (weak-first)",
  askMore: "📨 Ask for more questions",

  // company / source filter
  filterByCompany: "By company/source:",
  companyAll: "All",
  listCount: (n: number) => `${n} questions`,
  practicedTimes: (n: number) => `practiced ${n}×`,

  // question card
  lastGradeLabel: (g: string) => `Last ${g}`,
  close: "✕ Close",
  speakHint: "Speak aloud for 2–5 min first, then view the key points → ",
  // free coding area (SQL / Python coding questions)
  codeHint: "✍️ Write your solution here first (like the real thing, no peeking), then “Show key points” to compare",
  codePlaceholder: "-- Write your SQL / Python solution here…",
  compareMine: "✍️ Your solution",
  compareRef: "📌 Reference key points",
  compareHint: "Compare against the reference on the right: what did you miss? what could be cleaner/better? The gaps are your next gains.",
  submitReviewCode: "📨 Submit your solution to Claude for review (returned next day)",
  showKeyPoints: "Show key points",
  selfRate: "Self-rating:",
  reviewSummary: "✍️ Submit your spoken answer to Claude for review (6-dimension scoring, returned next day)",
  answerPlaceholder: "Use your phone's voice dictation/typing to paste your spoken answer here…",
  submitReview: "📨 Submit for review",
  nextWeakFirst: "🎲 Next question (weak-first)",
  startHint: "Click a question to start, or 🎲 draw at random.",

  // browse table
  collapseBank: "Collapse question bank",
  browseAll: (n: number) => `Browse all questions (${n})`,
  colId: "Q",
  colCategory: "Category",
  colQuestion: "Question",
  colPracticed: "Practiced",
  colLastRating: "Last rating",
};

export default practice;
