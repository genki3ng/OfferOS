const today = {
  // —— 日期 / 星期 ——
  dow: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"],
  monthSuffix: (m: number) => `${m}月`,
  whenLabel: (dow: string, m: number, d: number) => `${dow} · ${m}/${d}`,
  fullDate: (y: number, m: number, d: number) => `${y}年${m}月${d}日`,

  // —— 阶段轨 ——
  phases: ["定位", "铺管道", "备战", "谈判", "收尾"],
  railLabel: "你在这里",
  stageDone: "已完成",
  stageFilled: "进行中",
  stageActive: "你在这",
  stageTodo: "未开始",

  // —— 漏斗 ——
  funnelApply: "投递",
  funnelRecruiterCall: "招聘电话",
  funnelFirstRound: "首轮",
  funnelOnsite: "onsite",
  funnelOffer: "offer",

  // —— 进行中（该你出手了）——
  tagWait: "等回复",
  tagYours: "球在你这边",
  tagPrep: "备战中",
  tagWeek: "进行中",
  labelWaitReferral: "等内推回复",
  labelWaitRecruiter: "等 recruiter",
  labelYourMove: "该你回应",
  labelFirstRound: "首轮面试",
  labelRecruiterCall: "招聘电话",

  // —— 本周战绩 ——
  winInterviewing: (n: number) => `${n} 家进面试`,
  winResumeFinal: "简历已定稿",
  winReferralsSent: (n: number) => `${n} 条内推已发`,
  winRolesPinned: (n: number) => `${n} 个岗已锁定`,

  // —— 也在今天 ——
  todoPractice: "练 1 道题（15 分钟）",
  todoPracticeTag: "SQL",
  todoDecide: (s: string) => "拍板：" + s + "…",
  todoFollowUp: (name: string) => `跟进 ${name} 的进展`,

  // —— 问候副标题 ——
  greetSubInterviewing: (n: number) => `${n} 家在面试中，势头正好 — 把下面那一件做掉，今天就赢了。`,
  greetSubDefault: "把下面那一件做掉，今天就有进展。",

  // —— 唯一下一步（hero）——
  heroNow: "现在就做",
  heroTomorrow: "明天 · 准备好",
  heroDaysOut: (n: number) => `${n} 天后 · 提前备`,
  heroNext: "下一个",
  mustAskLabel: "三必问",
  mustAskSubteam: "sub-team / 方向",
  mustAskPerm: "PERM 时间线",
  mustAskLevel: "级别 + comp",
  onDeckB2B: "紧随其后 · 同步备",
  onDeckNext: "下一场",
  onDeckHint: "两场背靠背，一起准备",
  openBrief: "打开速备包",
  viewDetail: "查看详情",
  viewJd: "看 JD",
  viewPipeline: "看 pipeline",
  permDay1: "PERM day-1",

  // —— hero 空态 ——
  heroEmptyEyebrow: "今日",
  heroEmptyTitle: "今天没有硬日程 — 做一道练习题，保持手感。",
  goPractice: "去练习台",

  // —— 也在今天（tile）——
  todayTitle: "也在今天",

  // —— 本周面试与截止 ——
  weekEventsTitle: "本周面试与截止",
  itemsCount: (n: number) => `${n} 项`,
  weekEventsEmpty: "本周暂无硬日程 — 多铺管道、多练题。",

  // —— 进行中（tile）——
  inProgressTitle: "进行中",
  allCompanies: "全部公司 →",

  // —— 本周战绩（tile）——
  weekWinsTitle: "本周战绩",
  weekCheer: "这一周很扎实 — 保持住。",

  // —— 管道漏斗（tile）——
  funnelTitle: "管道漏斗",
  enterPipeline: "进 pipeline →",

  // —— 统计条 ——
  statTracking: "家在追",
  statOpenRoles: "个在招岗",
  statSprint: "冲刺进度",
  statReferralChannels: "条内推渠道",

  // —— 页脚（北极星走 getSiteConfig，prefix/suffix 包裹）——
  northStarPrefix: "北极星：",
  northStarSuffix: "。",
  northStarMore: " 详情 →",
};

export default today;
