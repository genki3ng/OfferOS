const countdown = {
  unitDay: "days",
  metaTitlePre: "until 9/1",
  metaTitlePost: "offer goal",
  weeksSprint: (weeks: number) => `${weeks}-week sprint`,
  elapsed: (pct: number) => `${pct}% done`,
  goalOnTrack: "On track",
  goalTight: "Tight on time",
  statusOnTrack: "On pace",
  statusTight: "Pick up the pace",
  interviewing: (n: number) => `${n} in interviews`,
  pushNext: "Get the next step moving",
};

export default countdown;
