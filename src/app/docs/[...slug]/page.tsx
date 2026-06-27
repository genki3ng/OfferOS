import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import path from "path";
import { getAllDocPaths, readDoc, getTaskLines, getResumeExports } from "@/lib/data";
import { isAllowedDoc, renderMarkdown, renderInline, parseFrontmatter } from "@/lib/markdown";
import Prose from "@/components/Prose";
import { getDict } from "@/i18n/server";

// frontmatter 信息条：已知键给图标，其余键显示键名。顺序 = 易变信息在前。
const FM_EMOJI: Record<string, string> = {
  round: "🎯",
  date: "🗓",
  interviewers: "👤",
  interviewer: "👤",
  company: "🏢",
};
const FM_ORDER = ["round", "date", "interviewers", "interviewer", "company"];
function fmEntries(data: Record<string, string>): [string, string][] {
  const keys = Object.keys(data).filter((k) => data[k]);
  return [
    ...FM_ORDER.filter((k) => keys.includes(k)),
    ...keys.filter((k) => !FM_ORDER.includes(k)),
  ].map((k) => [k, data[k]]);
}

export function generateStaticParams() {
  return getAllDocPaths().map((slug) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: slug[slug.length - 1] };
}

export default async function DocPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const rel = slug.map(decodeURIComponent).join("/") + ".md";
  if (!isAllowedDoc(rel)) notFound();
  const md = readDoc(rel);
  if (md === null) notFound();
  const { data: fm, body } = parseFrontmatter(md);
  const baseDir = path.posix.dirname(rel);
  const exp = getResumeExports().find((e) => e.source === rel);
  const d = await getDict();

  return (
    <>
      <p className="small">
        <Link href="/docs">{d.docsDoc.back}</Link>{" "}
        <span className="muted">
          · {rel} ·{" "}
          <a
            href={`https://github.com/genki3ng/jobhunt2026/blob/main/${rel}`}
            target="_blank"
            rel="noreferrer"
          >
            {d.docsDoc.editOnGithub}
          </a>
        </span>
      </p>
      {exp && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="card-title">{d.docsDoc.exportTitle}</div>
          <p className="small" style={{ margin: "6px 0" }}>
            <a className="btn mini" href={exp.docx} download>
              {d.docsDoc.exportDocx}
            </a>{" "}
            <a className="btn mini ghost" href={exp.html} target="_blank" rel="noreferrer">
              {d.docsDoc.exportHtml}
            </a>
          </p>
          <p className="small muted" style={{ margin: 0 }}>
            {d.docsDoc.exportNotePre}<code>{d.docsDoc.exportNoteFile}</code>{d.docsDoc.exportNotePost}
          </p>
        </div>
      )}
      {fmEntries(fm).length > 0 && (
        <div className="doc-fm">
          {fmEntries(fm).map(([k, v]) => (
            <span className="doc-fm-item" key={k}>
              {FM_EMOJI[k] ? (
                <span className="doc-fm-ico" aria-hidden>{FM_EMOJI[k]}</span>
              ) : (
                <span className="doc-fm-key">{k}</span>
              )}
              <span
                className="doc-fm-val"
                dangerouslySetInnerHTML={{
                  __html: renderInline(v, baseDir === "." ? "" : baseDir),
                }}
              />
            </span>
          ))}
        </div>
      )}
      <div className="card">
        <Prose
          html={renderMarkdown(body, baseDir === "." ? "" : baseDir)}
          path={rel}
          tasks={getTaskLines(body).map((t) => ({ text: t.text, checked: t.checked }))}
        />
      </div>
    </>
  );
}
