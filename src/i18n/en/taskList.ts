const taskList = {
  doneLabelDefault: "Completed",
  submitting: "Submitting…",
  doneMsg: "✓ Completed (tap again to undo a mis-click), site updates in ~1 min",
  undoMsg: "✓ Undone, site updates in ~1 min",
  failDefault: "Submit failed",
  failMsg: (reason: string) => `✗ ${reason}`,
  titleCanWrite: "Check / uncheck = commit straight to the source file",
  titleReadOnly: "Set a token in ⚙️ Settings to check items directly",
  moreHidden: (n: number) => `…${n} more not shown`,
  doneSummary: (label: string, n: number) => `✅ ${label} ${n} (uncheck mis-clicks here)`,
};

export default taskList;
