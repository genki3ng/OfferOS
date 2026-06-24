const pipeline = {
  title: "🏢 公司",
  subPre: "按",
  subStage: "旅程阶段",
  subPost: "看每家公司（不再是一张表）——一眼知道谁在推进、谁卡住、球在谁手里。卡内可直接改状态、标投递进度。源文件：",
  subBadge: "。徽章 ",
  subBadgeTail: " = 想去程度。",
  stageOffer: "Offer · 谈判",
  stageInterview: "面试中",
  stageRecruiter: "招聘电话 / Screen",
  stageSubmitted: "已投 · 内推",
  stageWatching: "在追 · 观察",
  count: (n: number) => `${n} 家`,
  careersTitle: "官方招聘页",
  referral: "内推",
  legend:
    "符号：🟢 友好 · 🟡 待核/有保留 · 🔴 风险 · 👑 day-1 PERM · ✅ 已确认。卡片按状态自动归入阶段（改状态后下次重建重新归位）。",
};

export default pipeline;
