const countdown = {
  unitDay: "天",
  metaTitlePre: "距 9/1",
  metaTitlePost: "offer 目标",
  weeksSprint: (weeks: number) => `${weeks} 周冲刺`,
  elapsed: (pct: number) => `已走 ${pct}%`,
  goalOnTrack: "准时可达",
  goalTight: "时间偏紧",
  statusOnTrack: "进度正常",
  statusTight: "抓紧节奏",
  interviewing: (n: number) => `${n} 家在面试中`,
  pushNext: "把下一步推进起来",
};

export default countdown;
