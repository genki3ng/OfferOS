import type { Metadata } from "next";
import { getJournal } from "@/lib/data";
import { renderInline, renderMarkdown } from "@/lib/markdown";
import { getDict } from "@/i18n/server";

export const metadata: Metadata = { title: "日志" };

export default async function JournalPage() {
  const entries = getJournal();
  const d = await getDict();
  return (
    <>
      <h1 className="page-title">{d.journal.title}</h1>
      <p className="page-sub">{d.journal.sub}</p>
      <div className="card">
        {entries.map((e, i) => (
          <div className="timeline-entry" key={i}>
            <h3 dangerouslySetInnerHTML={{ __html: renderInline(e.title, "log") }} />
            <div
              className="prose"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(e.body, "log") }}
            />
          </div>
        ))}
      </div>
    </>
  );
}
