const prepPage = {
  title: "📚 备战",
  sub: "DS 冲刺：统计/实验快擦亮（本职强项）· 产品 Sense 重点投入 · SQL 保温 · 并行找内推。",
  sprintTitle: "🏃 冲刺进度（勾选框统计）",
  sprintNotePre: "勾选在 ",
  sprintNotePost: " 里更新（让任意 session 改完 push 即可，这里自动刷新）。",
  materials: "📂 备战材料",
  companyNotes: (n: number) => `🗒 公司面经笔记（${n} 家）`,
  sprintFullText: "📋 sprint-plan.md 全文",
  sprintFullHint: "有 token 时勾选框可直接点",
  links: {
    questionBank: "🏋️ 题库（去练习台用更顺手 → /practice）",
    readme: "备战总览（含「用 AI 备战面试」四步法）",
    sprintPlan: "🏃 2–3 周冲刺计划（6/3–6/23）",
    mockBank: "Mock 题库 + 自评",
    companySpecific: "各公司定制考点",
    powerVariance: "Cheatsheet · Power & Variance",
    causalInference: "Cheatsheet · 因果推断",
    abtestPitfalls: "Cheatsheet · A/B 测试坑",
    modelExplain: "Cheatsheet · 模型解释",
    defineMetrics: "产品 Sense · 定义指标练习",
    diagnoseRatio: "产品 Sense · 比值指标诊断框架",
    marketplaceMetrics: "产品 Sense · Marketplace 指标",
    sqlWarmup: "SQL/Python 保温题",
  },
};

export default prepPage;
