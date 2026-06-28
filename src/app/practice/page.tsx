import type { Metadata } from "next";
import Link from "next/link";
import { getQuestionBank, getPracticeLog, getActiveRole } from "@/lib/data";
import { renderMarkdown } from "@/lib/markdown";
import { getDict } from "@/i18n/server";
import PracticeApp, { PracticeQ, QStat } from "./PracticeApp";

export const metadata: Metadata = { title: "练习台" };

export default async function PracticePage() {
  const role = getActiveRole();
  const base = `prep/${role.slug}`;
  const bank = getQuestionBank();
  const log = getPracticeLog();
  const d = await getDict();

  const questions: PracticeQ[] = bank.map((q) => ({
    id: q.id,
    category: q.category,
    companies: q.companies,
    // 列表里只显示标题行（去掉 markdown 反引号），正文/要点仍是渲染好的 HTML
    qText: q.q.split("\n")[0].replace(/[`*]/g, "").trim(),
    qHtml: renderMarkdown(q.q, "prep"),
    aHtml: renderMarkdown(q.a, "prep"),
  }));

  const stats: Record<string, QStat> = {};
  for (const r of log) {
    const s = stats[r.qid] ?? { count: 0, last: "", lastTime: "", notes: [] };
    s.count++;
    if (r.time >= s.lastTime) {
      s.last = r.grade;
      s.lastTime = r.time;
    }
    // 备注列 = Claude 批改点评；非空才收、渲染 markdown，供练习台内联展示
    if (r.note.trim()) {
      s.notes.push({ time: r.time, grade: r.grade, html: renderMarkdown(r.note, "prep") });
    }
    stats[r.qid] = s;
  }
  // 每题点评按时间倒序（最新点评排最前）
  for (const s of Object.values(stats)) {
    s.notes.sort((a, b) => (a.time < b.time ? 1 : a.time > b.time ? -1 : 0));
  }

  return (
    <>
      <h1 className="page-title">{d.practice.title} · {role.shortLabel}</h1>
      <p className="page-sub">
        {d.practice.subPre}
        <Link href={`/docs/${base}/question-bank`}>{base}/question-bank.md</Link>
        {d.practice.subMid(bank.length)}
        <Link href={`/docs/${base}/practice-log`}>practice-log.md</Link>
        {d.practice.subPost}
      </p>
      <PracticeApp questions={questions} stats={stats} prepBase={base} />
    </>
  );
}
