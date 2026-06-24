const referralKit = {
  emailBtn: "✉️ 邮件",
  emailBtnTitle: "按该渠道格式生成内推邮件",
  modalTitle: (channel: string) => `✉️ ${channel} · 内推邮件`,
  close: "关闭",
  pickHeading: "从岗位库勾选（已按契合度排序）：",
  customPlaceholderWithJobs: "岗位库没有的，贴链接（一行一个，可写「岗位名 — 链接」）",
  customPlaceholderNoJobs: "贴你想推的岗位链接（一行一个，可写「岗位名 — 链接」）",
  toLabel: "收件人：",
  subjectLabel: "主题：",
  copy: "复制",
  copied: "✓ 已复制",
  copyBody: "复制正文",
  copiedBody: "✓ 正文已复制",
  attachHint: "📎 附件（PDF 简历等）记得手动挂 · 发完回这页点「→ 已联系」推进状态",
  copyFail: "✗",
};

export default referralKit;
