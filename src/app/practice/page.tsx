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
    qHtml: renderMarkdown(q.q, "prep"),
    aHtml: renderMarkdown(q.a, "prep"),
  }));

  const stats: Record<string, QStat> = {};
  for (const r of log) {
    const s = stats[r.qid] ?? { count: 0, last: "", lastTime: "" };
    s.count++;
    if (r.time >= s.lastTime) {
      s.last = r.grade;
      s.lastTime = r.time;
    }
    stats[r.qid] = s;
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
