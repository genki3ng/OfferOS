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

export const metadata: Metadata = { title: "备战" };

const PREP_LINKS: { rel: string; label: string }[] = [
  { rel: "prep/question-bank", label: "🏋️ 题库（去练习台用更顺手 → /practice）" },
  { rel: "prep/README", label: "备战总览（含「用 AI 备战面试」四步法）" },
  { rel: "prep/sprint-plan", label: "🏃 2–3 周冲刺计划（6/3–6/23）" },
  { rel: "prep/mock-interview-bank", label: "Mock 题库 + 自评" },
  { rel: "prep/company-specific-prep", label: "各公司定制考点" },
  { rel: "prep/stats-experimentation/cheatsheet-power-variance", label: "Cheatsheet · Power & Variance" },
  { rel: "prep/stats-experimentation/cheatsheet-causal-inference", label: "Cheatsheet · 因果推断" },
  { rel: "prep/stats-experimentation/cheatsheet-abtest-pitfalls", label: "Cheatsheet · A/B 测试坑" },
  { rel: "prep/stats-experimentation/model-explain-cheatsheet", label: "Cheatsheet · 模型解释" },
  { rel: "prep/product-sense/practice-define-metrics", label: "产品 Sense · 定义指标练习" },
  { rel: "prep/product-sense/diagnose-ratio-metric", label: "产品 Sense · 比值指标诊断框架" },
  { rel: "prep/product-sense/cheatsheet-marketplace-metrics", label: "产品 Sense · Marketplace 指标" },
  { rel: "prep/sql-python/warmup-problems", label: "SQL/Python 保温题" },
];

export default function PrepPage() {
  const sprint = getSprintProgress();
  const notes = getCompanyNotes();
  const sprintMd = readDoc("prep/sprint-plan.md") ?? "";
  const pct = sprint.total ? Math.round((sprint.done / sprint.total) * 100) : 0;

  return (
    <>
      <h1 className="page-title">📚 备战</h1>
      <p className="page-sub">
        DS 冲刺：统计/实验快擦亮（本职强项）· 产品 Sense 重点投入 · SQL 保温 · 并行找内推。
      </p>

      <div className="grid grid-2 section">
        <div className="card">
          <div className="card-title">
            🏃 冲刺进度（勾选框统计）
            <span className="more muted">
              {sprint.done}/{sprint.total} · {pct}%
            </span>
          </div>
          <div className="bar" style={{ marginBottom: 14 }}>
            <i style={{ width: `${pct}%` }} />
          </div>
          <p className="muted small">
            勾选在 <Link href="/docs/prep/sprint-plan">prep/sprint-plan.md</Link>{" "}
            里更新（让任意 session 改完 push 即可，这里自动刷新）。
          </p>
          <div className="card-title" style={{ marginTop: 18 }}>📂 备战材料</div>
          <ul>
            {PREP_LINKS.map((l) => {
              const md = readDoc(l.rel + ".md");
              if (md === null) return null;
              const p = countCheckboxes(md);
              return (
                <li key={l.rel}>
                  <Link href={`/docs/${l.rel}`}>{l.label}</Link>
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
          <div className="card-title" style={{ marginTop: 18 }}>🗒 公司面经笔记（{notes.length} 家）</div>
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
            📋 sprint-plan.md 全文
            <span className="more muted small">有 token 时勾选框可直接点</span>
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
