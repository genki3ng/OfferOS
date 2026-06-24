const taskList = {
  doneLabelDefault: "已完成",
  submitting: "提交中…",
  doneMsg: "✓ 已完成（误勾再点一下即撤销），约 1 分钟后全站更新",
  undoMsg: "✓ 已撤销，约 1 分钟后全站更新",
  failDefault: "提交失败",
  failMsg: (reason: string) => `✗ ${reason}`,
  titleCanWrite: "勾 / 取消 = 直接 commit 源文件",
  titleReadOnly: "在 ⚙️ 设置里配 token 后可直接打勾",
  moreHidden: (n: number) => `…还有 ${n} 项未列出`,
  doneSummary: (label: string, n: number) => `✅ ${label} ${n} 项（误勾的来这里取消）`,
};

export default taskList;
