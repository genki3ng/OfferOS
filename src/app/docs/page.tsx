import type { Metadata } from "next";
import Link from "next/link";
import { getDocIndex, getResumeExports } from "@/lib/data";
import { getDict } from "@/i18n/server";

export const metadata: Metadata = { title: "文档" };

export default async function DocsIndexPage() {
  const groups = getDocIndex();
  const exports = new Map(getResumeExports().map((e) => [e.source.replace(/\.md$/, ""), e]));
  const d = await getDict();
  return (
    <>
      <h1 className="page-title">{d.docs.title}</h1>
      <p className="page-sub">
        {d.docs.subPre}<Link href="/pipeline">{d.docs.subMid}</Link>{d.docs.subPost}
      </p>
      <div className="grid grid-2">
        {groups.map((g) => (
          <div className="card doc-group" key={g.label}>
            <div className="card-title">{g.label}</div>
            <ul>
              {g.files.map((f) => {
                const exp = exports.get(f.rel);
                return (
                  <li key={f.rel}>
                    <Link href={`/docs/${f.rel}`}>{f.title}</Link>
                    {exp && (
                      <span className="small muted">
                        {" "}· <a href={exp.docx} download>{d.docs.docx}</a> ·{" "}
                        <a href={exp.html} target="_blank" rel="noreferrer">{d.docs.html}</a>
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}
