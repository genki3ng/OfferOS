"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { AgendaItem } from "@/lib/data";
import { useDict } from "@/i18n/client";

/** 日程时间轴（客户端算"几天后"，避免静态页日期过期） */
export default function AgendaList({
  items,
  limit,
  compact = false,
}: {
  items: AgendaItem[];
  limit?: number;
  compact?: boolean;
}) {
  const d = useDict();
  const [today, setToday] = useState("");
  useEffect(() => setToday(new Date().toISOString().slice(0, 10)), []);
  if (!today) return null;

  // 逾期只算「有意安排却滑过」的待办（tracker ⏰ / offer 截止）；
  // 历史里程碑（关键日期表里发生过的事）过期 ≠ 逾期，归「一路走来」，不在此刷成红色。
  const overdue = items.filter((i) => i.date < today && i.actionable);
  const upcoming = items.filter((i) => i.date >= today);
  const show = limit ? upcoming.slice(0, limit) : upcoming;
  const days = (d: string) =>
    Math.round((new Date(d).getTime() - new Date(today).getTime()) / 86400000);

  if (!items.length)
    return compact ? (
      <p className="muted small">
        {d.agendaList.emptyCompact}
      </p>
    ) : (
      <p className="muted">
        {d.agendaList.emptyPre}<code>YYYY-MM-DD</code>{d.agendaList.emptyMid}<code>⏰MM-DD</code>{d.agendaList.emptyPost}
      </p>
    );

  const row = (i: AgendaItem, od = false) => (
    <li key={i.date + i.label + i.company} className="agenda-row">
      <span className={`agenda-date ${od ? "overdue" : days(i.date) <= 3 ? "soon" : ""}`}>
        {i.date.slice(5)}
        <em>{od ? d.agendaList.overdue(-days(i.date)) : days(i.date) === 0 ? d.agendaList.today : d.agendaList.daysOut(days(i.date))}</em>
      </span>
      <span className="agenda-label" title={i.label}>
        {i.slug ? <Link href={`/companies/${i.slug}`}>{i.company}</Link> : i.company}{" "}
        {i.labelShort || i.label}
        {i.time ? <b className="agenda-time"> · {i.time}</b> : null}
      </span>
    </li>
  );

  return (
    <ul className="agenda-list">
      {(compact ? overdue.slice(-3) : overdue).map((i) => row(i, true))}
      {show.map((i) => row(i))}
    </ul>
  );
}
