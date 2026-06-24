import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import path from "path";
import { getAllDocPaths, readDoc, getTaskLines, getResumeExports } from "@/lib/data";
import { isAllowedDoc, renderMarkdown } from "@/lib/markdown";
import Prose from "@/components/Prose";
import { getDict } from "@/i18n/server";

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
      <div className="card">
        <Prose
          html={renderMarkdown(md, baseDir === "." ? "" : baseDir)}
          path={rel}
          tasks={getTaskLines(md).map((t) => ({ text: t.text, checked: t.checked }))}
        />
      </div>
    </>
  );
}
