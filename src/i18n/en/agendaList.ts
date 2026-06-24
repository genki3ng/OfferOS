const agendaList = {
  emptyCompact: "Nothing dated coming up (interviews/deadlines auto-aggregate here once entered).",
  emptyPre: "Nothing dated yet. Convention: fill a company file's “Key dates” table with ",
  emptyMid: ", or start a tracker “Next step” with ",
  emptyPost: ", and it'll auto-aggregate here.",
  today: "today",
  daysOut: (n: number) => `${n} days out`,
  overdue: (n: number) => `overdue ${n} days`,
};

export default agendaList;
