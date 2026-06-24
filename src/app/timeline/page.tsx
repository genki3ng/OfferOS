import type { Metadata } from "next";
import Link from "next/link";
import { getAgenda, getPinnedOpenings, getJournal } from "@/lib/data";
import { renderInline } from "@/lib/markdown";
import AgendaList from "@/components/AgendaList";

export const metadata: Metadata = { title: "时间线" };

/** 时间线 = 全站「什么时候该干什么」的唯一页面（合并了旧 /agenda 日程）：
 *  待办（无固定日期）→ 即将发生（面试/截止，自动聚合）→ 一路走来（历史日志）。 */
export default function TimelinePage() {
  const agenda = getAgenda();
  const pins = getPinnedOpenings();
  const todo = pins.filter((o) => o.appStatus === "");
  const interview = pins.filter((o) => o.appStatus === "interview");
  const journal = getJournal().slice(0, 18);

  return (
    <>
      <h1 className="page-title">🗓️ 时间线</h1>
      <p className="page-sub">
        一页看「什么时候该干什么」：待办 → 即将发生（面试 / 截止）→ 一路走来。自动聚合各公司「关键日期」表（
        <code>YYYY-MM-DD</code>）、tracker「下一步」的 <code>⏰MM-DD</code> 前缀、offers 截止日。
      </p>

      {(todo.length > 0 || interview.length > 0) && (
        <div className="card section">
          <div className="card-title">
            📌 投递待办（无固定日期，跟着 pipeline 进度走）
            <Link className="more" href="/pipeline">
              去 pipeline 标进度 →
            </Link>
          </div>
          <ul className="next-list">
            {todo.map((o) => (
              <li key={o.slug + o.anchor}>
                待投：<Link href={`/companies/${o.slug}`}>{o.company}</Link> · {o.title}
              </li>
            ))}
            {interview.map((o) => (
              <li key={o.slug + o.anchor}>
                🗣️ 面试中：<Link href={`/companies/${o.slug}`}>{o.company}</Link> · {o.title} — 建/查面前速备包
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-2 section">
        <div className="card">
          <div className="card-title">即将发生 / Deadline</div>
          <AgendaList items={agenda} />
        </div>

        <div className="card">
          <div className="card-title">
            一路走来
            <Link className="more" href="/journal">
              全部日志 →
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
        录入入口：公司页「⚡ 快改」写 <code>⏰MM-DD …</code> 到下一步；或 📨 派活（面试日程）让 Claude 记进「关键日期」表并生成
        <b>面前速备包</b>（prep/briefs/）。模板见 <Link href="/docs/pipeline/companies/_TEMPLATE">_TEMPLATE</Link>。
      </p>
    </>
  );
}
