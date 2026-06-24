const coldOutreach = {
  pillSearching: "🔍 LinkedIn 找人中",
  pillFriend: "🤝 熟人引荐中",
  pillGiveup: "✖️ 已放弃 · 直接网申",

  solveBtn: "🧭 解决",
  modalTitle: (name: string) => `🧭 ${name} · 内推怎么解决`,
  close: "关闭",

  chipLinkedin: "🔍 LinkedIn 找陌生人",
  chipFriend: "🤝 找认识的人",
  chipGiveup: "✖️ 放弃 referral",

  intro:
    "选一条路：LinkedIn 冷启动（找该公司 DS 发连接请求 + DM）、找认识的人（话术已备）、或者放弃内推直接网申。选完会把策略标记写进 tracker，缺口名单里就能看到进展。",

  searchBtn: (name: string) => `① 在 LinkedIn 搜 ${name} 的 DS →`,
  searchHint: "优先：同方向 DS > 同校/同社区 > 华人；挑 2–3 人，别群发",

  jobPickHeading: "提哪个岗（建议 1 个，📌 已预选）：",

  connectLabel: "② 连接请求（≤300 字符）",
  dmLabel: "③ 通过后发 DM",
  markSearching: "④ 标记为 🔍 找人中",
  noteSearching: "已标记 LinkedIn 找人中",

  friendLabel: "话术（EN + 中，删掉不用的那段）",
  friendHint: "发完记得补三件套：简历 PDF + JD 链接 + 三人称简介。",
  markFriend: "标记为 🤝 引荐中",
  noteFriend: "已标记熟人引荐中",

  giveupText:
    "放弃 referral = 直接官网投递（内推过的回复率高 ~3–5 倍，确定吗？）。标记后该公司仍留在缺口名单里、显示 ✖️，想反悔随时换策略。",
  markGiveup: "确认 ✖️ 放弃内推",
  noteGiveup: "已标记放弃，直接网申",

  needTokenTitle: "在 ⚙️ 设置配 token 后可写入",
  copy: "复制",
  copied: "✓ 已复制",
  copyFail: "✗",

  writing: "写入 tracker…",
  writeOk: (note: string) => `✓ ${note}（已写进 tracker，约 1 分钟后全站更新）`,
  writeFail: (err: string) => `✗ ${err}`,
  writeFailDefault: "写入失败",
};

export default coldOutreach;
