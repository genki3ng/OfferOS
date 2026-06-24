const today = {
  // —— Date / day-of-week ——
  dow: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  monthSuffix: (m: number) => `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1]}`,
  whenLabel: (dow: string, m: number, d: number) => `${dow} · ${m}/${d}`,
  fullDate: (y: number, m: number, d: number) => `${["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][m - 1]} ${d}, ${y}`,

  // —— Stage rail ——
  phases: ["Position", "Build pipeline", "Prep", "Negotiate", "Close"],
  railLabel: "You're here",
  stageDone: "Done",
  stageFilled: "In progress",
  stageActive: "You're here",
  stageTodo: "Not started",

  // —— Funnel ——
  funnelApply: "Applied",
  funnelRecruiterCall: "Recruiter call",
  funnelFirstRound: "First round",
  funnelOnsite: "Onsite",
  funnelOffer: "Offer",

  // —— In progress (your move) ——
  tagWait: "Awaiting reply",
  tagYours: "Ball's in your court",
  tagPrep: "Prepping",
  tagWeek: "In progress",
  labelWaitReferral: "Awaiting referral reply",
  labelWaitRecruiter: "Awaiting recruiter",
  labelYourMove: "Your move",
  labelFirstRound: "First-round interview",
  labelRecruiterCall: "Recruiter call",

  // —— This week's wins ——
  winInterviewing: (n: number) => `${n} interviewing`,
  winResumeFinal: "Resume finalized",
  winReferralsSent: (n: number) => `${n} referrals sent`,
  winRolesPinned: (n: number) => `${n} roles pinned`,

  // —— Also today ——
  todoPractice: "Do 1 problem (15 min)",
  todoPracticeTag: "SQL",
  todoDecide: (s: string) => "Decide: " + s + "…",
  todoFollowUp: (name: string) => `Follow up on ${name}`,

  // —— Greeting subtitle ——
  greetSubInterviewing: (n: number) => `${n} interviewing — momentum's good. Knock out the one thing below and today's a win.`,
  greetSubDefault: "Knock out the one thing below and you've made progress today.",

  // —— Next step (hero) ——
  heroNow: "Do it now",
  heroTomorrow: "Tomorrow · be ready",
  heroDaysOut: (n: number) => `${n} days out · prep ahead`,
  heroNext: "Next up",
  mustAskLabel: "Three must-asks",
  mustAskSubteam: "sub-team / focus",
  mustAskPerm: "PERM timeline",
  mustAskLevel: "level + comp",
  openBrief: "Open prep brief",
  viewDetail: "View details",
  viewJd: "View JD",
  viewPipeline: "View pipeline",
  permDay1: "PERM day-1",

  // —— Hero empty state ——
  heroEmptyEyebrow: "Today",
  heroEmptyTitle: "No hard commitments today — do a practice problem to stay sharp.",
  goPractice: "Go to practice",

  // —— Also today (tile) ——
  todayTitle: "Also today",

  // —— This week's interviews & deadlines ——
  weekEventsTitle: "This week's interviews & deadlines",
  itemsCount: (n: number) => `${n} items`,
  weekEventsEmpty: "No hard commitments this week — keep building pipeline and practicing.",

  // —— In progress (tile) ——
  inProgressTitle: "In progress",
  allCompanies: "All companies →",

  // —— This week's wins (tile) ——
  weekWinsTitle: "This week's wins",
  weekCheer: "Solid week — keep it up.",

  // —— Pipeline funnel (tile) ——
  funnelTitle: "Pipeline funnel",
  enterPipeline: "Go to pipeline →",

  // —— Stat bar ——
  statTracking: "tracking",
  statOpenRoles: "open roles",
  statSprint: "Sprint progress",
  statReferralChannels: "referral channels",

  // —— Footer (north star comes from getSiteConfig, wrapped by prefix/suffix) ——
  northStarPrefix: "North star: ",
  northStarSuffix: ".",
  northStarMore: " Details →",
};

export default today;
