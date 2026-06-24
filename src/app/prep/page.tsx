import type { Metadata } from "next";
import Link from "next/link";
import {
  getSprintProgress,
  getCompanyNotes,
  readDoc,
  countCheckboxes,
  getTaskLines,
} from "@/lib/data";
import { renderMarkdown } from "@/lib/markdown";
import Prose from "@/components/Prose";
import { getDict } from "@/i18n/server";

export const metadata: Metadata = { title: "备战" };

const PREP_LINKS: { rel: string; key: keyof Awaited<ReturnType<typeof getDict>>["prepPage"]["links"] }[] = [
  { rel: "prep/question-bank", key: "questionBank" },
  { rel: "prep/README", key: "readme" },
  { rel: "prep/sprint-plan", key: "sprintPlan" },
  { rel: "prep/mock-interview-bank", key: "mockBank" },
  { rel: "prep/company-specific-prep", key: "companySpecific" },
  { rel: "prep/stats-experimentation/cheatsheet-power-variance", key: "powerVariance" },
  { rel: "prep/stats-experimentation/cheatsheet-causal-inference", key: "causalInference" },
  { rel: "prep/stats-experimentation/cheatsheet-abtest-pitfalls", key: "abtestPitfalls" },
  { rel: "prep/stats-experimentation/model-explain-cheatsheet", key: "modelExplain" },
  { rel: "prep/product-sense/practice-define-metrics", key: "defineMetrics" },
  { rel: "prep/product-sense/diagnose-ratio-metric", key: "diagnoseRatio" },
  { rel: "prep/product-sense/cheatsheet-marketplace-metrics", key: "marketplaceMetrics" },
  { rel: "prep/sql-python/warmup-problems", key: "sqlWarmup" },
];

export default async function PrepPage() {
  const sprint = getSprintProgress();
  const notes = getCompanyNotes();
  const sprintMd = readDoc("prep/sprint-plan.md") ?? "";
  const pct = sprint.total ? Math.round((sprint.done / sprint.total) * 100) : 0;
  const d = await getDict();

  return (
    <>
      <h1 className="page-title">{d.prepPage.title}</h1>
      <p className="page-sub">
        {d.prepPage.sub}
      </p>

      <div className="grid grid-2 section">
        <div className="card">
          <div className="card-title">
            {d.prepPage.sprintTitle}
            <span className="more muted">
              {sprint.done}/{sprint.total} · {pct}%
            </span>
          </div>
          <div className="bar" style={{ marginBottom: 14 }}>
            <i style={{ width: `${pct}%` }} />
          </div>
          <p className="muted small">
            {d.prepPage.sprintNotePre}<Link href="/docs/prep/sprint-plan">prep/sprint-plan.md</Link>{" "}
            {d.prepPage.sprintNotePost}
          </p>
          <div className="card-title" style={{ marginTop: 18 }}>{d.prepPage.materials}</div>
          <ul>
            {PREP_LINKS.map((l) => {
              const md = readDoc(l.rel + ".md");
              if (md === null) return null;
              const p = countCheckboxes(md);
              return (
                <li key={l.rel}>
                  <Link href={`/docs/${l.rel}`}>{d.prepPage.links[l.key]}</Link>
                  {p.total > 0 && (
                    <span className="muted small">
                      {" "}
                      （{p.done}/{p.total}）
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="card-title" style={{ marginTop: 18 }}>{d.prepPage.companyNotes(notes.length)}</div>
          <ul>
            {notes.map((n) => (
              <li key={n}>
                <Link href={`/docs/prep/company-notes/${n}`}>{n}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <div className="card-title">
            {d.prepPage.sprintFullText}
            <span className="more muted small">{d.prepPage.sprintFullHint}</span>
          </div>
          <Prose
            html={renderMarkdown(sprintMd, "prep")}
            path="prep/sprint-plan.md"
            tasks={getTaskLines(sprintMd).map((t) => ({ text: t.text, checked: t.checked }))}
          />
        </div>
      </div>
    </>
  );
}
