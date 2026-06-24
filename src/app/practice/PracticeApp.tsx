"use client";

import { useEffect, useMemo, useState } from "react";
import { appendPracticeLog, getToken } from "@/lib/githubClient";
import { useDict } from "@/i18n/client";

export interface PracticeQ {
  id: string;
  category: string;
  qHtml: string;
  aHtml: string;
}

export interface QStat {
  count: number;
  last: string; // 最近一次自评 emoji
  lastTime: string;
}

export default function PracticeApp({
  questions,
  stats,
  prepBase = "prep",
}: {
  questions: PracticeQ[];
  stats: Record<string, QStat>;
  prepBase?: string;
}) {
  const d = useDict();
  const GRADES = [
    { v: "😣", label: d.practice.gradeStuck },
    { v: "😐", label: d.practice.gradeShaky },
    { v: "😎", label: d.practice.gradeFluent },
  ];
  const categories = useMemo(
    () => Array.from(new Set(questions.map((q) => q.category))),
    [questions]
  );
  const [cat, setCat] = useState("");
  const [cur, setCur] = useState<PracticeQ | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [answer, setAnswer] = useState("");
  const [canWrite, setCanWrite] = useState(false);
  const [msg, setMsg] = useState("");
  const [local, setLocal] = useState<Record<string, string>>({}); // 本次会话新自评
  const [browse, setBrowse] = useState(false); // 手机端：是否展开底部全题表

  // 挂载时：读 token；按 URL ?q=<题号> 直接打开对应题（速备包题号链接进来即定位）；并读本机暂存自评（无 token 也持久、并入「优先薄弱」权重）。
  useEffect(() => {
    setCanWrite(!!getToken());
    const qid =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("q")
        : null;
    if (qid) {
      const q = questions.find((x) => x.id === qid);
      if (q) {
        setCur(q);
        setRevealed(false);
      }
    }
    try {
      const o = JSON.parse(localStorage.getItem("jh_practice_grades") || "{}");
      if (o && typeof o === "object") setLocal((m) => ({ ...o, ...m }));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 把当前题写进 URL（?q=），便于分享/返回，也让速备包深链与地址栏一致。
  const syncUrl = (id: string | null) => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("q", id);
    else url.searchParams.delete("q");
    window.history.replaceState(null, "", url);
  };

  const pool = cat ? questions.filter((q) => q.category === cat) : questions;
  const lastGrade = (id: string) => local[id] ?? stats[id]?.last ?? "";

  const pick = (q: PracticeQ) => {
    setCur(q);
    setRevealed(false);
    setAnswer("");
    setMsg("");
    syncUrl(q.id);
  };

  const close = () => {
    setCur(null);
    syncUrl(null);
  };

  const random = () => {
    const weak = pool.filter((q) => lastGrade(q.id) !== "😎");
    const from = weak.length ? weak : pool;
    pick(from[Math.floor(Math.random() * from.length)]);
  };

  const grade = async (g: string) => {
    if (!cur) return;
    setLocal((m) => ({ ...m, [cur.id]: g }));
    try {
      const k = "jh_practice_grades";
      const o = JSON.parse(localStorage.getItem(k) || "{}");
      o[cur.id] = g;
      localStorage.setItem(k, JSON.stringify(o));
    } catch {}
    if (!canWrite) {
      setMsg(d.practice.msgRecordedLocal);
      return;
    }
    setMsg(d.practice.msgSubmitting);
    try {
      await appendPracticeLog(cur.id, g, "", `${prepBase}/practice-log.md`);
      setMsg(d.practice.msgWritten);
    } catch (e) {
      setMsg(`✗ ${e instanceof Error ? e.message : d.practice.msgFailed}`);
    }
  };

  const askReview = () => {
    if (!cur) return;
    window.dispatchEvent(
      new CustomEvent("ask-claude", {
        detail: {
          kind: "Mock 面试",
          topic: `批改我的口述答案 [${cur.id}]`,
          detail: `题目见 ${prepBase}/question-bank.md 的 [${cur.id}]。\n\n我的答案（口述转文字）：\n${answer || "（把你的答案粘到这里再提交）"}\n\n请按 mock-interview-bank 自评表打分点评，坑点回填对应 cheatsheet，并把结果记到 ${prepBase}/practice-log.md。`,
        },
      })
    );
  };

  const askMore = () => {
    const weak = questions
      .filter((q) => lastGrade(q.id) === "😣" || lastGrade(q.id) === "😐")
      .map((q) => q.id);
    window.dispatchEvent(
      new CustomEvent("ask-claude", {
        detail: {
          kind: "出题练习",
          topic: `往题库加题${cat ? `：${cat}` : ""}`,
          detail: `请按 question-bank.md 的格式契约追加题目。${
            weak.length ? `我的薄弱题：${weak.join("、")}——优先出同类变体。` : ""
          }`,
        },
      })
    );
  };

  return (
    <>
      <div className="chips" style={{ marginBottom: 12 }}>
        <button className={`chip ${cat === "" ? "on" : ""}`} onClick={() => setCat("")}>
          {d.practice.all(questions.length)}
        </button>
        {categories.map((c) => (
          <button
            key={c}
            className={`chip ${cat === c ? "on" : ""}`}
            onClick={() => setCat(c)}
          >
            {c} {questions.filter((q) => q.category === c).length}
          </button>
        ))}
        <button className="btn" onClick={random}>
          {d.practice.drawWeakFirst}
        </button>
        <button className="btn ghost" onClick={askMore}>
          {d.practice.askMore}
        </button>
      </div>

      {cur ? (
        <div className="card section practice-card">
          <div className="card-title">
            <span className="pill gray">{cur.id}</span> {cur.category}
            {lastGrade(cur.id) && <span className="pill blue">{d.practice.lastGradeLabel(lastGrade(cur.id))}</span>}
            <button className="more btn ghost mini" onClick={close}>
              {d.practice.close}
            </button>
          </div>
          <div className="prose" dangerouslySetInnerHTML={{ __html: cur.qHtml }} />
          {!revealed ? (
            <p>
              <span className="muted small">{d.practice.speakHint}</span>
              <button className="btn" onClick={() => setRevealed(true)}>
                {d.practice.showKeyPoints}
              </button>
            </p>
          ) : (
            <>
              <div className="answer prose" dangerouslySetInnerHTML={{ __html: cur.aHtml }} />
              <div style={{ margin: "12px 0" }}>
                <span className="muted small">{d.practice.selfRate}</span>
                <div className="grade-row rate">
                  {GRADES.map((g) => (
                    <button key={g.v} className="btn ghost" onClick={() => grade(g.v)}>
                      {g.label}
                    </button>
                  ))}
                </div>
                {msg && <p className="small" style={{ marginTop: 6 }}>{msg}</p>}
              </div>
              <details>
                <summary className="muted small" style={{ cursor: "pointer" }}>
                  {d.practice.reviewSummary}
                </summary>
                <textarea
                  className="field"
                  rows={6}
                  placeholder={d.practice.answerPlaceholder}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                />
                <button className="btn" onClick={askReview} disabled={!answer.trim()}>
                  {d.practice.submitReview}
                </button>
              </details>
            </>
          )}
          {revealed && (
            <div className="grade-row" style={{ marginTop: 14 }}>
              <button className="btn" onClick={random}>{d.practice.nextWeakFirst}</button>
            </div>
          )}
        </div>
      ) : (
        <p className="muted small">{d.practice.startHint}</p>
      )}

      <button className="btn ghost practice-browse-toggle" onClick={() => setBrowse((b) => !b)}>
        📋 {browse ? d.practice.collapseBank : d.practice.browseAll(pool.length)}
      </button>
      <div className={`card practice-browse${browse ? " show" : ""}`}>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>{d.practice.colId}</th>
                <th>{d.practice.colCategory}</th>
                <th>{d.practice.colQuestion}</th>
                <th>{d.practice.colPracticed}</th>
                <th>{d.practice.colLastRating}</th>
              </tr>
            </thead>
            <tbody>
              {pool.map((q) => (
                <tr key={q.id} onClick={() => pick(q)} style={{ cursor: "pointer" }}>
                  <td className="muted small" data-label={d.practice.colId}>{q.id}</td>
                  <td className="muted small" data-label={d.practice.colCategory} style={{ whiteSpace: "nowrap" }}>
                    {q.category}
                  </td>
                  <td data-label={d.practice.colQuestion} dangerouslySetInnerHTML={{ __html: q.qHtml.replace(/<\/?p>/g, "") }} />
                  <td data-label={d.practice.colPracticed}>{(stats[q.id]?.count ?? 0) + (local[q.id] ? 1 : 0) || ""}</td>
                  <td data-label={d.practice.colLastRating}>{lastGrade(q.id)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
