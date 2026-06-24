import type { Metadata } from "next";
import Link from "next/link";
import { getAgenda, getPinnedOpenings, getJournal } from "@/lib/data";
import { renderInline } from "@/lib/markdown";
import AgendaList from "@/components/AgendaList";
import { getDict } from "@/i18n/server";

export const metadata: Metadata = { title: "时间线" };

/** 时间线 = 全站「什么时候该干什么」的唯一页面（合并了旧 /agenda 日程）：
 *  待办（无固定日期）→ 即将发生（面试/截止，自动聚合）→ 一路走来（历史日志）。 */
export default async function TimelinePage() {
  const agenda = getAgenda();
  const pins = getPinnedOpenings();
  const todo = pins.filter((o) => o.appStatus === "");
  const interview = pins.filter((o) => o.appStatus === "interview");
  const journal = getJournal().slice(0, 18);
  const d = await getDict();

  return (
    <>
      <h1 className="page-title">{d.timeline.title}</h1>
      <p className="page-sub">
        {d.timeline.subPre}
        <code>YYYY-MM-DD</code>{d.timeline.subMid}<code>⏰MM-DD</code>{d.timeline.subPost}
      </p>

      {(todo.length > 0 || interview.length > 0) && (
        <div className="card section">
          <div className="card-title">
            {d.timeline.todoTitle}
            <Link className="more" href="/pipeline">
              {d.timeline.goPipeline}
            </Link>
          </div>
          <ul className="next-list">
            {todo.map((o) => (
              <li key={o.slug + o.anchor}>
                {d.timeline.toApply}<Link href={`/companies/${o.slug}`}>{o.company}</Link> · {o.title}
              </li>
            ))}
            {interview.map((o) => (
              <li key={o.slug + o.anchor}>
                {d.timeline.interviewing}<Link href={`/companies/${o.slug}`}>{o.company}</Link> · {o.title}{d.timeline.interviewSuffix}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-2 section">
        <div className="card">
          <div className="card-title">{d.timeline.upcoming}</div>
          <AgendaList items={agenda} />
        </div>

        <div className="card">
          <div className="card-title">
            {d.timeline.journey}
            <Link className="more" href="/journal">
              {d.timeline.allLogs}
            </Link>
          </div>
          {journal.map((e) => (
            <div className="timeline-entry" key={e.title}>
              <h3 dangerouslySetInnerHTML={{ __html: renderInline(e.title, "log") }} />
            </div>
          ))}
        </div>
      </div>

      <p className="muted small">
        {d.timeline.footerPre}<code>⏰MM-DD …</code>{d.timeline.footerMid}
        <b>{d.timeline.footerBrief}</b>{d.timeline.footerTemplate}<Link href="/docs/pipeline/companies/_TEMPLATE">_TEMPLATE</Link>{d.timeline.footerEnd}
      </p>
    </>
  );
}
