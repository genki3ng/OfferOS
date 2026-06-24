const referralKit = {
  emailBtn: "✉️ Email",
  emailBtnTitle: "Generate a referral email in this channel's format",
  modalTitle: (channel: string) => `✉️ ${channel} · Referral Email`,
  close: "Close",
  pickHeading: "Pick from the role library (sorted by fit):",
  customPlaceholderWithJobs: 'Not in the library? Paste links (one per line, e.g. "Role — link")',
  customPlaceholderNoJobs: 'Paste the role links you want to pitch (one per line, e.g. "Role — link")',
  toLabel: "To: ",
  subjectLabel: "Subject: ",
  copy: "Copy",
  copied: "✓ Copied",
  copyBody: "Copy body",
  copiedBody: "✓ Body copied",
  attachHint: '📎 Remember to attach files (resume PDF, etc.) manually · After sending, come back here and click "→ Contacted" to advance the status',
  copyFail: "✗",
};

export default referralKit;
