const agendaList = {
  emptyCompact: "近期无带日期的事项（面试/截止日期录入后自动聚合到这里）。",
  emptyPre: "暂无带日期的事项。约定：公司文件「关键日期」表填 ",
  emptyMid: "，或 tracker「下一步」用 ",
  emptyPost: " 开头，这里就会自动聚合。",
  today: "今天",
  daysOut: (n: number) => `${n} 天后`,
  overdue: (n: number) => `逾期 ${n} 天`,
};

export default agendaList;
