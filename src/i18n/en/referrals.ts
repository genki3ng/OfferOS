const referrals = {
  title: "🤝 Referral Channels",
  subSrc: "Source: ",
  subFlow: " · Status flow: Found → Contacted → Materials sent → Referral submitted → Applied",
  missingTitle: (n: number) => `🕳 Companies still missing a referral (${n})`,
  missingHint: 'Click "🧭 Resolve": LinkedIn cold outreach / find a contact / skip and apply directly',
  tier: ["", "1", "2", "3"],
  templatesPre: "Full scripts (A: contacts / B: strangers, EN & ZH): ",
  fullTextTitle: "📄 Full referrals.md (rules & notes included)",
};

export default referrals;
