const dailyGuide = {
  cardTitle: "🤖 今日 SOP · 照着做就行",
  rulesLink: "规则与例外 →",
  goPrefix: "👉 ",

  learn: {
    title: "冲刺学习",
    time: "60–90 分钟",
    detailOpen: (open: number, first: string) => `本周剩 ${open} 项 · 下一项：${first}`,
    detailDone: "本周任务已清空 🎉",
    cta: "去今日聚焦",
  },
  practice: {
    title: "练习台 1 题",
    time: "15 分钟",
    detailDone: (n: number) => `今天已练 ${n} 题 ✓`,
    detailOpen: "抽 1 题 → 先口述 → 对要点自评",
    cta: "去抽题",
  },
  pinList: {
    title: "定投递清单",
    time: "15 分钟",
    detail: "清单还是空的——把想投的岗 📌 起来，内推邮件才有的放矢",
    cta: "去岗位库选岗",
  },
  referral: {
    title: "内推推进",
    time: "10 分钟",
    detailStale: (stale: number) => `${stale} 条渠道超 3 天没动静 → 催 / 换`,
    detailOk: (pinned: number) => `清单 📌${pinned} 岗 · 没有要催的渠道，按渠道发邮件即可`,
    cta: "去发内推邮件",
  },
  wrap: {
    title: "收尾巡检",
    time: "5 分钟",
    pending: (n: number) => `${n} 项待拍板`,
    inbox: (n: number) => `收件箱 ${n} 条`,
    detailEmpty: "没有挂起事项；有新面经/JD 用扩展收进 inbox",
    cta: "去拍板",
  },
};

export default dailyGuide;
