"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { appendPracticeLog, getToken } from "@/lib/githubClient";
import { useDict } from "@/i18n/client";

export interface PracticeQ {
  id: string;
  category: string;
  companies: string[];
  qText: string; // 标题行纯文本（列表显示用）
  qHtml: string;
  aHtml: string;
}

export interface ReviewNote {
  time: string;
  grade: string;
  html: string; // 点评正文（practice-log 备注列）渲染好的 HTML
}

export interface QStat {
  count: number;
  last: string; // 最近一次自评 emoji
  lastTime: string;
  notes: ReviewNote[]; // Claude 批改点评（最新在前），仅含备注非空的记录
}

// 编程题（SQL / Python / 算法）= 给 free-coding 框，让用户先手写解法再对照要点；
// 其余（统计·产品 Sense·行为面）保留「出声讲 → 看要点」的口述流程。
const isCoding = (category: string) => /sql|python|coding|算法|代码/i.test(category);

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
  // 公司/来源标签（出现过的）+ 各自题数，给过滤 chip 用
  const companies = useMemo(() => {
    const m = new Map<string, number>();
    for (const q of questions) for (const c of q.companies) m.set(c, (m.get(c) ?? 0) + 1);
    return Array.from(m.entries());
  }, [questions]);

  const [cat, setCat] = useState("");
  const [company, setCompany] = useState("");
  const [cur, setCur] = useState<PracticeQ | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [attempts, setAttempts] = useState<Record<string, string>>({}); // 各题的自由作答（手写解法/笔记），本机持久、不丢已输入
  const [canWrite, setCanWrite] = useState(false);
  const [msg, setMsg] = useState("");
  const [local, setLocal] = useState<Record<string, string>>({}); // 本次会话新自评
  const [browse, setBrowse] = useState(false); // 手机端：是否展开题表
  const detailRef = useRef<HTMLDivElement>(null);

  // 挂载时：读 token；按 URL ?q=<题号> 直接打开对应题；并读本机暂存自评（无 token 也持久、并入「优先薄弱」权重）。
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
    try {
      const a = JSON.parse(localStorage.getItem("jh_practice_attempts") || "{}");
      if (a && typeof a === "object") setAttempts((m) => ({ ...a, ...m }));
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

  const pool = useMemo(
    () =>
      questions.filter(
        (q) => (!cat || q.category === cat) && (!company || q.companies.includes(company))
      ),
    [questions, cat, company]
  );
  const lastGrade = (id: string) => local[id] ?? stats[id]?.last ?? "";

  // 当前题是否编程题 + 当前题的自由作答（编程题=手写解法，其它=口述转写），写时即存本机。
  const coding = cur ? isCoding(cur.category) : false;
  const curAnswer = cur ? attempts[cur.id] ?? "" : "";
  // 当前题的 Claude 点评（来自 practice-log 备注列，最新在前）
  const curNotes = cur ? stats[cur.id]?.notes ?? [] : [];
  const setAttempt = (text: string) => {
    if (!cur) return;
    setAttempts((m) => ({ ...m, [cur.id]: text }));
    try {
      const k = "jh_practice_attempts";
      const o = JSON.parse(localStorage.getItem(k) || "{}");
      o[cur.id] = text;
      localStorage.setItem(k, JSON.stringify(o));
    } catch {}
  };

  // Tab 在 code 框内缩进（默认会把焦点跳出去）——Tab 进 2 空格 / Shift+Tab 退；多行选区整体缩进。
  const onCodeKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Tab") return;
    e.preventDefault();
    const ta = e.currentTarget;
    const { selectionStart: s, selectionEnd: en, value } = ta;
    const indent = "  ";
    const lineStart = value.lastIndexOf("\n", s - 1) + 1;
    let next: string;
    let ns: number;
    let ne: number;
    if (e.shiftKey) {
      let firstCut = 0;
      let totalCut = 0;
      const dedented = value
        .slice(lineStart, en)
        .split("\n")
        .map((ln, i) => {
          const m = ln.match(/^(\t| {1,2})/);
          const cut = m ? m[0].length : 0;
          if (i === 0) firstCut = cut;
          totalCut += cut;
          return ln.slice(cut);
        });
      next = value.slice(0, lineStart) + dedented.join("\n") + value.slice(en);
      ns = Math.max(lineStart, s - firstCut);
      ne = en - totalCut;
    } else if (s !== en && value.slice(s, en).includes("\n")) {
      const lines = value.slice(lineStart, en).split("\n");
      next = value.slice(0, lineStart) + lines.map((ln) => indent + ln).join("\n") + value.slice(en);
      ns = s + indent.length;
      ne = en + indent.length * lines.length;
    } else {
      next = value.slice(0, s) + indent + value.slice(en);
      ns = ne = s + indent.length;
    }
    setAttempt(next);
    requestAnimationFrame(() => {
      ta.selectionStart = ns;
      ta.selectionEnd = ne;
    });
  };

  const pick = (q: PracticeQ) => {
    setCur(q);
    setRevealed(false);
    setMsg("");
    syncUrl(q.id);
    // 单列（手机/窄屏）时，题目卡在上方——点列表后平滑滚到卡片，给出明确反馈。
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 900px)").matches) {
      requestAnimationFrame(() =>
        detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      );
    }
  };

  const close = () => {
    setCur(null);
    syncUrl(null);
  };

  const random = () => {
    const weak = pool.filter((q) => lastGrade(q.id) !== "😎");
    const from = weak.length ? weak : pool;
    if (!from.length) return;
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
    const mine = curAnswer.trim() || "（把你的答案粘到这里再提交）";
    window.dispatchEvent(
      new CustomEvent("ask-claude", {
        detail: {
          kind: "Mock 面试",
          topic: `批改我的${coding ? "解法" : "口述答案"} [${cur.id}]`,
          detail: coding
            ? `题目见 ${prepBase}/question-bank.md 的 [${cur.id}]。\n\n我手写的解法（代码）：\n\`\`\`\n${mine}\n\`\`\`\n\n请对照该题要点逐条点评：正确性 / 是否漏 edge case / 能否更简洁高效 / 命名与可读性；指出与参考解法的差异，并把结果记到 ${prepBase}/practice-log.md。`
            : `题目见 ${prepBase}/question-bank.md 的 [${cur.id}]。\n\n我的答案（口述转文字）：\n${mine}\n\n请按 mock-interview-bank 自评表打分点评，坑点回填对应 cheatsheet，并把结果记到 ${prepBase}/practice-log.md。`,
        },
      })
    );
  };

  const askMore = () => {
    const weak = questions
      .filter((q) => lastGrade(q.id) === "😣" || lastGrade(q.id) === "😐")
      .map((q) => q.id);
    const scope = [cat, company].filter(Boolean).join(" · ");
    window.dispatchEvent(
      new CustomEvent("ask-claude", {
        detail: {
          kind: "出题练习",
          topic: `往题库加题${scope ? `：${scope}` : ""}`,
          detail: `请按 question-bank.md 的格式契约追加题目。${
            scope ? `范围：${scope}。` : ""
          }${weak.length ? `我的薄弱题：${weak.join("、")}——优先出同类变体。` : ""}`,
        },
      })
    );
  };

  const tagChips = (list: string[]) =>
    list.map((c) => (
      <span key={c} className="tag-chip">
        {c}
      </span>
    ));

  return (
    <>
      {/* 类别过滤 + 抽题/加题 */}
      <div className="chips" style={{ marginBottom: 8 }}>
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

      {/* 公司/来源过滤 */}
      {companies.length > 0 && (
        <div className="chips chips-filter" style={{ marginBottom: 12 }}>
          <span className="muted small filter-label">{d.practice.filterByCompany}</span>
          <button
            className={`chip ${company === "" ? "on" : ""}`}
            onClick={() => setCompany("")}
          >
            {d.practice.companyAll}
          </button>
          {companies.map(([c, n]) => (
            <button
              key={c}
              className={`chip ${company === c ? "on" : ""}`}
              onClick={() => setCompany((p) => (p === c ? "" : c))}
            >
              {c} {n}
            </button>
          ))}
        </div>
      )}

      <div className="practice-split">
        {/* 题目 + 要点（桌面在右、手机在上） */}
        <div className="practice-detail" ref={detailRef}>
          {cur ? (
            <div className="card section practice-card">
              <div className="card-title">
                <span className="pill gray">{cur.id}</span> {cur.category}
                {tagChips(cur.companies)}
                {lastGrade(cur.id) && (
                  <span className="pill blue">{d.practice.lastGradeLabel(lastGrade(cur.id))}</span>
                )}
                <button className="more btn ghost mini" onClick={close}>
                  {d.practice.close}
                </button>
              </div>
              <div className="prose" dangerouslySetInnerHTML={{ __html: cur.qHtml }} />
              {curNotes.length ? (
                <details className="review-box">
                  <summary>{d.practice.reviewHeading(curNotes.length)}</summary>
                  {curNotes.map((nt, i) => (
                    <div className="review-item" key={i}>
                      <div className="review-meta muted small">
                        {nt.time}
                        {nt.grade ? ` · ${nt.grade}` : ""}
                      </div>
                      <div className="prose" dangerouslySetInnerHTML={{ __html: nt.html }} />
                    </div>
                  ))}
                </details>
              ) : null}
              {!revealed ? (
                coding ? (
                  // 编程题：先在框里手写解法（模拟实战），再看要点
                  <div className="code-attempt">
                    <p className="muted small" style={{ margin: "2px 0 4px" }}>
                      {d.practice.codeHint}
                    </p>
                    <textarea
                      className="code-box"
                      rows={10}
                      spellCheck={false}
                      placeholder={d.practice.codePlaceholder}
                      value={curAnswer}
                      onChange={(e) => setAttempt(e.target.value)}
                      onKeyDown={onCodeKeyDown}
                    />
                    <button className="btn" onClick={() => setRevealed(true)}>
                      {d.practice.showKeyPoints}
                    </button>
                  </div>
                ) : (
                  // 语言题（产品 Sense / 统计 / 行为面）：先在框里口述作答（可语音转文字），再看要点对照
                  <div className="answer-attempt">
                    <p className="muted small" style={{ margin: "2px 0 4px" }}>
                      {d.practice.speakHint}
                    </p>
                    <p className="muted small dictate-tip" style={{ margin: "0 0 6px" }}>
                      {d.practice.dictateTip}
                    </p>
                    <textarea
                      className="field"
                      rows={8}
                      placeholder={d.practice.answerPlaceholder}
                      value={curAnswer}
                      onChange={(e) => setAttempt(e.target.value)}
                    />
                    <button className="btn" onClick={() => setRevealed(true)}>
                      {d.practice.showKeyPoints}
                    </button>
                  </div>
                )
              ) : (
                <>
                  {coding ? (
                    // 揭晓后：左=你写的解法（仍可改，当笔记），右=参考要点，并排对照差异
                    <>
                      <div className="compare">
                        <div className="compare-col">
                          <div className="compare-label">{d.practice.compareMine}</div>
                          <textarea
                            className="code-box"
                            rows={10}
                            spellCheck={false}
                            placeholder={d.practice.codePlaceholder}
                            value={curAnswer}
                            onChange={(e) => setAttempt(e.target.value)}
                            onKeyDown={onCodeKeyDown}
                          />
                        </div>
                        <div className="compare-col">
                          <div className="compare-label">{d.practice.compareRef}</div>
                          <div
                            className="answer prose"
                            dangerouslySetInnerHTML={{ __html: cur.aHtml }}
                          />
                        </div>
                      </div>
                      <p className="muted small compare-hint">{d.practice.compareHint}</p>
                    </>
                  ) : curAnswer.trim() ? (
                    // 语言题揭晓后：你的答案 / 参考要点 上下对照
                    <>
                      <div className="compare">
                        <div className="compare-col">
                          <div className="compare-label">{d.practice.compareMineAnswer}</div>
                          <textarea
                            className="field"
                            rows={8}
                            placeholder={d.practice.answerPlaceholder}
                            value={curAnswer}
                            onChange={(e) => setAttempt(e.target.value)}
                          />
                        </div>
                        <div className="compare-col">
                          <div className="compare-label">{d.practice.compareRef}</div>
                          <div
                            className="answer prose"
                            dangerouslySetInnerHTML={{ __html: cur.aHtml }}
                          />
                        </div>
                      </div>
                      <p className="muted small compare-hint">{d.practice.compareHintAnswer}</p>
                    </>
                  ) : (
                    <div className="answer prose" dangerouslySetInnerHTML={{ __html: cur.aHtml }} />
                  )}
                  <div style={{ margin: "12px 0" }}>
                    <span className="muted small">{d.practice.selfRate}</span>
                    <div className="grade-row rate">
                      {GRADES.map((g) => (
                        <button key={g.v} className="btn ghost" onClick={() => grade(g.v)}>
                          {g.label}
                        </button>
                      ))}
                    </div>
                    {msg && (
                      <p className="small" style={{ marginTop: 6 }}>
                        {msg}
                      </p>
                    )}
                  </div>
                  <button
                    className="btn ghost"
                    onClick={askReview}
                    disabled={!curAnswer.trim()}
                  >
                    {coding ? d.practice.submitReviewCode : d.practice.submitReview}
                  </button>
                </>
              )}
              {revealed && (
                <div className="grade-row" style={{ marginTop: 14 }}>
                  <button className="btn" onClick={random}>
                    {d.practice.nextWeakFirst}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="card section practice-empty">
              <p className="muted">{d.practice.startHint}</p>
              <button className="btn" onClick={random} disabled={!pool.length}>
                {d.practice.drawWeakFirst}
              </button>
            </div>
          )}
        </div>

        {/* 题目列表（桌面在左、手机在下可折叠） */}
        <aside className="practice-list-col">
          <button
            className="btn ghost practice-browse-toggle"
            onClick={() => setBrowse((b) => !b)}
          >
            📋 {browse ? d.practice.collapseBank : d.practice.browseAll(pool.length)}
          </button>
          <div className="practice-list-head muted small">{d.practice.listCount(pool.length)}</div>
          <ul className={`practice-list${browse ? " show" : ""}`}>
            {pool.map((q) => {
              const g = lastGrade(q.id);
              const n = (stats[q.id]?.count ?? 0) + (local[q.id] ? 1 : 0);
              return (
                <li key={q.id}>
                  <button
                    className={`practice-item${cur?.id === q.id ? " on" : ""}`}
                    onClick={() => pick(q)}
                  >
                    <div className="pi-top">
                      <span className="pill gray mini">{q.id}</span>
                      {tagChips(q.companies)}
                      {g && <span className="pi-grade">{g}</span>}
                      {stats[q.id]?.notes?.length ? (
                        <span className="pi-review" title={d.practice.reviewBadge}>
                          📝
                        </span>
                      ) : null}
                    </div>
                    <div className="pi-q">{q.qText}</div>
                    {n > 0 && <div className="pi-meta muted small">{d.practice.practicedTimes(n)}</div>}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>
      </div>
    </>
  );
}
