const practice = {
  // page.tsx
  title: "🏋️ 练习台",
  subPre: "题库 = ",
  subMid: (n: number) => `（${n} 题）· 自评自动写 `,
  subPost: " · 我会按记录找薄弱点出补强材料。流程：抽题 → 出声讲 / 手写解法 → 看要点对照 → 自评（→ 可选交批改）。",

  // GRADES labels
  gradeStuck: "😣 不会",
  gradeShaky: "😐 磕绊",
  gradeFluent: "😎 流畅",

  // status messages
  msgRecordedLocal: "已记录这次自评（已存本机；配 token 后长期保存到练习日志）",
  msgSubmitting: "提交中…",
  msgWritten: "✓ 已写入 practice-log.md",
  msgFailed: "失败",

  // chips row
  all: (n: number) => `全部 ${n}`,
  drawWeakFirst: "🎲 抽一题（优先薄弱）",
  askMore: "📨 要更多题",

  // company / source filter
  filterByCompany: "按公司/来源：",
  companyAll: "全部",
  listCount: (n: number) => `共 ${n} 题`,
  practicedTimes: (n: number) => `练过 ${n} 次`,

  // question card
  lastGradeLabel: (g: string) => `上次 ${g}`,
  close: "✕ 关闭",
  speakHint: "先出声讲 2–5 分钟，再看要点 → ",
  // free coding 区（SQL / Python 等编程题）
  codeHint: "✍️ 先在框里手写解法（像实战一样、别看要点），写完再「显示要点」对照",
  codePlaceholder: "-- 在这里写你的 SQL / Python 解法……",
  compareMine: "✍️ 你的解法",
  compareRef: "📌 参考要点",
  compareHint: "对照右边的参考要点：你漏了哪些点？哪里能写得更简洁/更优？差异就是下次的提分点。",
  submitReviewCode: "📨 把你的解法交给 Claude 批改（次日出）",
  showKeyPoints: "显示要点",
  selfRate: "自评：",
  reviewSummary: "✍️ 把口述答案交给 Claude 批改（6 维评分，次日出）",
  answerPlaceholder: "用手机语音听写/打字把你的口述贴进来…",
  submitReview: "📨 提交批改",
  nextWeakFirst: "🎲 下一题（优先薄弱）",
  startHint: "点一道题开始，或 🎲 随机抽。",

  // browse table
  collapseBank: "收起题库",
  browseAll: (n: number) => `浏览全部题（${n}）`,
  colId: "题",
  colCategory: "类别",
  colQuestion: "题目",
  colPracticed: "练过",
  colLastRating: "最近自评",
};

export default practice;
