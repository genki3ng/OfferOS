const todayCard = {
  title: (week: string) => `☀️ Today's focus · ${week}`,
  fullPlan: "Full plan →",
  weekProgress: (done: number, total: number) => `This week ${done}/${total}`,
  doneLabel: "Done this week",
  emptyText: "All tasks done for the week 🎉 Go practice or push a referral.",
  parallelTrack: "Parallel track · referral outreach",
};

export default todayCard;
