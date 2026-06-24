const todayCard = {
  title: (week: string) => `☀️ 今日聚焦 · ${week}`,
  fullPlan: "完整计划 →",
  weekProgress: (done: number, total: number) => `本周 ${done}/${total}`,
  doneLabel: "本周已完成",
  emptyText: "本周任务全部完成 🎉 去练手或推进内推。",
  parallelTrack: "并行轨 · 内推 outreach",
};

export default todayCard;
