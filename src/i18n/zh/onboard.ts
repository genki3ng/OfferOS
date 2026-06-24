const onboard = {
  // 步骤名（顶部进度）
  steps: ["身份", "目标角色", "级别", "地区", "签证", "目标公司", "北极星", "确认"],

  // 工作形态 / 签证 —— 按钮上的可见标签
  modeRemote: "远程 Remote",
  modeHybrid: "混合 Hybrid",
  modeOnsite: "现场 Onsite",
  visaNeeded: "需要 sponsorship",
  visaNotNeeded: "不需要",
  visaUnsure: "待定",

  // 完成页
  doneTitle: "✅ 设置完成",
  donePackPre: "已把你的身份、角色（",
  donePackMid: "）、目标公司写进仓库，并给 Claude 留了一条生成 ",
  donePackPost: " 备战 pack 的请求。",
  doneNote:
    "Vercel 会在 ~1 分钟内重建上线，届时全站文案会变成你的。接下来：在 Claude Code 里说「读 CLAUDE.md 和 HANDOFF.md，处理 inbox」即可。",
  doneBackHome: "回到今日 →",

  // 向导头部
  title: "🚀 设置 OfferOS",
  subPre: "回答几个问题，把这个模板变成",
  subStrong: "你的",
  subMid: "求职指挥台，并选好对应角色的备战模板。",
  stepLabel: (cur: number, total: number, name: string) => `步骤 ${cur}/${total}：${name}`,

  // Step 0 身份
  nameLabel: "你的名字",
  nameHint: "首页问候语、页面文案里用。",
  namePlaceholder: "如 Jane Doe / 张三",
  initialsLabel: "头像缩写",
  initialsHint: "右上角头像，1–3 字符；留空自动从名字取。",

  // Step 1 目标角色
  roleLabel: "你的目标角色",
  roleHint: "决定备战题库、面试轮次与北极星模板。",

  // Step 2 级别
  currentLevelLabel: "当前级别",
  currentLevelHint: "点预设或自己填。",
  currentLevelPlaceholder: "如 Senior (IC5)",
  targetLevelLabel: "目标级别",
  targetLevelPlaceholder: "如 Staff (IC6)",

  // Step 3 地区
  workModeLabel: "工作形态",
  regionsLabel: "地区 / 城市偏好",
  regionsHint: "逗号分隔，可留空。",
  regionsPlaceholder: "如 美国主要城市、Remote、Bay Area",

  // Step 4 签证
  visaLabel: "是否需要签证 sponsorship？",

  // Step 5 目标公司
  companiesLabel: "目标公司",
  companiesHint: "回车或逗号添加；会写进 tracker（pipeline）。可留空稍后再加。",
  companiesPlaceholder: "如 Northwind",
  companiesAdd: "添加",

  // Step 6 北极星
  mottoLabel: "问候口头禅（motto）",
  mottoHint: "首页问候里的鼓励语。",
  mottoPlaceholder: "稳住节奏，",
  northStarLabel: "北极星（一句话目标）",
  northStarHint: "留空则按角色模板自动生成（见下方预览）。",
  northStarPreviewPrefix: "预览：",

  // Step last 确认
  confirmTitle: "确认要写入的 profile",
  confirmHasTokenPre: "将提交到仓库 ",
  confirmHasTokenMid1: "：写 ",
  confirmHasTokenMid2: "、重置 ",
  confirmHasTokenMid3: "、重写 ",
  confirmHasTokenPost: (shortLabel: string) =>
    `，并给 Claude 留一条生成 ${shortLabel} 备战 pack 的请求。Vercel ~1 分钟后重建上线。`,
  confirmWrite: "确认并写入仓库 →",
  confirmWriting: "写入中…",
  confirmNoTokenPre: "还没连 GitHub（没配 PAT）。两个选择：① 去 ",
  confirmNoTokenMid:
    " 配一把细粒度 PAT 再回来，这页的答案已自动暂存；② 或者把下面这段交给 Claude / Codex，让它替你写进仓库。",
  confirmCopy: "复制给 Claude / Codex",
  confirmCopied: "已复制 ✓",
  confirmGoPat: "去配 PAT →",

  // 写入失败兜底
  writeFailed: "写入失败",

  // 导航
  navPrev: "← 上一步",
  navNext: "下一步 →",
};

export default onboard;
