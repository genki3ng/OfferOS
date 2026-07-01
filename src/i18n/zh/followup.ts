const followup = {
  title: "跟进雷达",
  countChase: (n: number) => `${n} 家该跟进`,
  allClear: "都在 SLA 内 · 无需催",
  none: "暂无等回复的公司",

  // 沉默天数 + 档位徽章
  silent: (d: number) => `沉默 ${d} 天`,
  badgeOverdue: (d: number) => `该催 · 超 ${d} 天`,
  badgeSoon: (d: number) => `快到线 · 还 ${d} 天`,
  badgeOk: (d: number) => `等回复 · 还 ${d} 天`,

  // 在等什么（副标签）
  awaitReferred: "内推后等 recruiter",
  awaitApplied: "自投后等 recruiter",
  awaitNextRound: "等约下一轮",
  awaitConnection: "等连接通过",

  // 该催时的建议动作
  actReferred: "请内推人帮查状态 / 轻追 recruiter",
  actApplied: "LinkedIn 找 recruiter，或补个暖内推",
  actNextRound: "让 recruiter 推进下一轮排期",
  actConnection: "没通过就换后备内推人",

  more: "全部公司 →",
  slaNote: "到线阈值：内推 14 天 · 自投 21 天 · 面后 7 天 · 连接 7 天",
};

export default followup;
