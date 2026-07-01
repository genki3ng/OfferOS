"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useDict } from "@/i18n/client";
import {
  collectFollowups,
  type AwaitingKind,
  type FollowupInput,
} from "@/lib/followup";

function initials(name: string) {
  const letters = name.replace(/[^A-Za-z]/g, "");
  return (letters.slice(0, 2) || name.slice(0, 2)).replace(/^./, (c) => c.toUpperCase());
}

/**
 * 跟进雷达 tile：把每家「沉默了几天 / 该不该催」实时算出来（浏览器端 new Date，不吃构建时间）。
 * 数据 = tracker 里带 lastContact+awaiting 的公司，逻辑见 lib/followup.ts。
 */
export default function FollowupRadar({ rows }: { rows: FollowupInput[] }) {
  const d = useDict().followup;
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);

  const todayISO = now
    ? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
        now.getDate()
      ).padStart(2, "0")}`
    : null;
  const items = todayISO ? collectFollowups(rows, todayISO) : [];
  const chase = items.filter((i) => i.level !== "ok").length;

  const awaitLabel: Record<AwaitingKind, string> = {
    "recruiter-referred": d.awaitReferred,
    "recruiter-applied": d.awaitApplied,
    "next-round": d.awaitNextRound,
    connection: d.awaitConnection,
  };
  const actionLabel: Record<AwaitingKind, string> = {
    "recruiter-referred": d.actReferred,
    "recruiter-applied": d.actApplied,
    "next-round": d.actNextRound,
    connection: d.actConnection,
  };

  return (
    <section className="tile radar c12">
      <div className="tile-head">
        <span className="tile-title">
          <span className="ic">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" />
            </svg>
          </span>
          {d.title}
        </span>
        {now && (
          <span className={"tile-count " + (chase > 0 ? "chase" : "clear")}>
            {chase > 0 ? d.countChase(chase) : d.allClear}
          </span>
        )}
      </div>

      {!now ? (
        <p className="muted">…</p>
      ) : items.length === 0 ? (
        <p className="muted">{d.none}</p>
      ) : (
        <ul className="radar-list">
          {items.map((it) => {
            const badge =
              it.level === "overdue"
                ? d.badgeOverdue(it.overBy)
                : it.level === "soon"
                ? d.badgeSoon(-it.overBy)
                : d.badgeOk(-it.overBy);
            return (
              <li key={it.slug || it.name} className={`rl ${it.level}`}>
                <span className="radar-logo">{initials(it.name)}</span>
                <div className="info">
                  <b>
                    {it.slug ? <Link href={`/companies/${it.slug}`}>{it.name}</Link> : it.name}
                  </b>
                  <span className="sub">
                    {awaitLabel[it.awaiting]} · {d.silent(it.daysSilent)}
                  </span>
                  {it.level === "overdue" && (
                    <span className="act">→ {actionLabel[it.awaiting]}</span>
                  )}
                </div>
                <span className={`rl-badge ${it.level}`}>
                  <span className="pip" />
                  {badge}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <p className="radar-note">{d.slaNote}</p>
    </section>
  );
}
