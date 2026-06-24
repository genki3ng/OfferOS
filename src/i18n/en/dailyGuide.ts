const dailyGuide = {
  cardTitle: "🤖 Today's SOP · just follow it",
  rulesLink: "Rules & exceptions →",
  goPrefix: "👉 ",

  learn: {
    title: "Sprint study",
    time: "60–90 min",
    detailOpen: (open: number, first: string) => `${open} left this week · next: ${first}`,
    detailDone: "This week's tasks are clear 🎉",
    cta: "Go to today's focus",
  },
  practice: {
    title: "1 practice question",
    time: "15 min",
    detailDone: (n: number) => `${n} practiced today ✓`,
    detailOpen: "Pull 1 question → say it out loud → self-check against the key points",
    cta: "Go pull a question",
  },
  pinList: {
    title: "Set your shortlist",
    time: "15 min",
    detail: "Shortlist is still empty — 📌 the roles you want so referral emails have a target",
    cta: "Go pick roles",
  },
  referral: {
    title: "Push referrals",
    time: "10 min",
    detailStale: (stale: number) => `${stale} channels quiet for 3+ days → nudge / switch`,
    detailOk: (pinned: number) => `📌${pinned} roles shortlisted · nothing to chase, just email each channel`,
    cta: "Go send referral emails",
  },
  wrap: {
    title: "Wrap-up check",
    time: "5 min",
    pending: (n: number) => `${n} to decide`,
    inbox: (n: number) => `${n} in inbox`,
    detailEmpty: "Nothing pending; capture new prep notes/JDs into the inbox via the extension",
    cta: "Go decide",
  },
};

export default dailyGuide;
