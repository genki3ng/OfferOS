"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useDict } from "@/i18n/client";

export interface GuideWeek {
  start: string;
  end: string;
  label: string;
  open: number;
  first: string;
}

/**
 * 今日 SOP 步骤条：固定四步（学习→练习→内推→收尾），每步按仓库数据自动算完成态，
 * 👉 指向第一个未完成步骤。规则全文 → prep/daily-routine.md。
 */
export default function DailyGuide({
  weeks,
  practiceDates,
  referralStatuses,
  pendingOpen,
  inboxCount,
  pinnedJobs,
}: {
  weeks: GuideWeek[];
  practiceDates: string[];
  referralStatuses: string[];
  pendingOpen: number;
  inboxCount: number;
  pinnedJobs: number; // 📌 投递清单岗位数
}) {
  const d = useDict().dailyGuide;
  const [today, setToday] = useState("");
  useEffect(() => setToday(new Date().toISOString().slice(0, 10)), []);
  if (!today) return null;

  const week =
    weeks.find((w) => today >= w.start && today <= w.end) ??
    weeks.find((w) => today < w.start) ??
    weeks[weeks.length - 1];
  const practicedToday = practiceDates.filter((d) => d === today).length;
  const stale = referralStatuses.filter((s) => {
    const d = s.match(/\d{4}-\d{2}-\d{2}/)?.[0];
    if (!d || s.startsWith("已投递")) return false;
    return (new Date(today).getTime() - new Date(d).getTime()) / 86400000 >= 3;
  }).length;

  const steps = [
    {
      icon: "🧠",
      title: d.learn.title,
      time: d.learn.time,
      done: !week || week.open === 0,
      detail:
        week && week.open > 0
          ? d.learn.detailOpen(week.open, week.first)
          : d.learn.detailDone,
      href: "#today",
      cta: d.learn.cta,
    },
    {
      icon: "🎤",
      title: d.practice.title,
      time: d.practice.time,
      done: practicedToday > 0,
      detail:
        practicedToday > 0
          ? d.practice.detailDone(practicedToday)
          : d.practice.detailOpen,
      href: "/practice",
      cta: d.practice.cta,
    },
    pinnedJobs === 0
      ? {
          icon: "🤝",
          title: d.pinList.title,
          time: d.pinList.time,
          done: false,
          detail: d.pinList.detail,
          href: "/jobs?pinned",
          cta: d.pinList.cta,
        }
      : {
          icon: "🤝",
          title: d.referral.title,
          time: d.referral.time,
          done: stale === 0,
          detail:
            stale > 0
              ? d.referral.detailStale(stale)
              : d.referral.detailOk(pinnedJobs),
          href: "/referrals",
          cta: d.referral.cta,
        },
    {
      icon: "📨",
      title: d.wrap.title,
      time: d.wrap.time,
      done: pendingOpen === 0 && inboxCount === 0,
      detail:
        [
          pendingOpen ? d.wrap.pending(pendingOpen) : "",
          inboxCount ? d.wrap.inbox(inboxCount) : "",
        ]
          .filter(Boolean)
          .join(" · ") || d.wrap.detailEmpty,
      href: "#decide",
      cta: d.wrap.cta,
    },
  ];
  const current = steps.findIndex((s) => !s.done);

  return (
    <div className="card section">
      <div className="card-title">
        {d.cardTitle}
        <Link className="more" href="/docs/prep/daily-routine">
          {d.rulesLink}
        </Link>
      </div>
      <ol className="sop-steps">
        {steps.map((s, i) => (
          <li key={s.title} className={s.done ? "done" : i === current ? "now" : ""}>
            <div className="sop-head">
              <span className="sop-num">{s.done ? "✓" : i + 1}</span>
              <b>
                {s.icon} {s.title}
              </b>
              <span className="muted small">{s.time}</span>
            </div>
            <div className="sop-detail small">{s.detail}</div>
            {!s.done && (
              <Link className="sop-go small" href={s.href}>
                {i === current ? d.goPrefix : ""}
                {s.cta} →
              </Link>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
