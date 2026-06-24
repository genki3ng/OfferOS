const jobs = {
  // page.tsx
  title: "📋 岗位库",
  sub: "15 家 pipeline 公司「当前 opening」段的聚合视图（来源 = pipeline/companies/*.md，扫岗 2–4 周会重抓，岗位会变动）。",

  // JobsTable — status messages
  submitting: "提交中…",
  pinAdded: "📌 已加入投递清单（约 1 分钟后全站更新）",
  pinRemoved: "已移出投递清单",
  attLove: "💚 标为心仪（约 1 分钟后全站更新）",
  attNo: "🚫 标为不合适",
  attCleared: "已清除态度",
  submitFailed: "提交失败",

  // JobsTable — filters
  searchPlaceholder: "搜索岗位 / 地点 / 关键词…",
  sortTitle: "排序方式",
  sortDefault: "排序：默认（📌→💚→梯队→契合）",
  sortAtt: "排序：态度（💚 心仪优先）",
  sortFit: "排序：契合度（⭐🎯）",
  sortCo: "排序：按公司",
  sortNew: "排序：最近抓取",
  allTiers: "全部梯队",
  tier1: "🥇 第一梯队",
  tier2: "🥈 第二梯队",
  tier3: "🥉 第三梯队",
  allCompanies: "全部公司",
  onlyPinned: (n: number) => `📌 只看投递清单（${n}）`,
  hideNo: "🚫 隐藏不合适",
  includeExcluded: "含已排除",

  // JobsTable — summary line
  summary: (count: number, pinnedCount: number, loveCount: number) =>
    `${count} 个岗位 · ⭐/🎯 = 各 session 扫岗判断 · 📌 = 投递清单（${pinnedCount}，**会显示在 pipeline 对应公司下、可标投递进度**）· 💚 = 心仪（${loveCount}）/ 🚫 = 不合适`,
  summaryCanWrite: "，点行内按钮切换",
  summaryReadOnly: "——在 ⚙️ 设置配 token 后可直接点选",

  // JobsTable — table headers
  thAtt: "态度",
  thAttTitle: "态度：点击循环 未定→💚心仪→🚫不合适",
  thCompany: "公司",
  thFit: "契合",
  thRole: "岗位与说明（原文）",
  thLocation: "地点",
  thFetched: "抓取",

  // JobsTable — data-labels (mobile card labels)
  dlList: "清单",
  dlAtt: "态度",
  dlCompany: "公司",
  dlFit: "契合",
  dlRole: "岗位",
  dlLocation: "地点",
  dlFetched: "抓取",

  // JobsTable — pin button titles
  pinUnpinTitle: "移出投递清单（也会从 pipeline 公司下移除）",
  pinAddTitle:
    "📌 加入投递清单 → 会显示在 pipeline 对应公司下（可在那标投递进度）；内推弹窗也自动预选",
  pinDisabledTitle: "在 ⚙️ 设置配 token 后可点选",

  // JobsTable — attitude button titles
  attCycleTitle: "点击循环：未定 → 💚 心仪 → 🚫 不合适",
  attDisabledTitle: "在 ⚙️ 设置配 token 后可点选",
};

export default jobs;
