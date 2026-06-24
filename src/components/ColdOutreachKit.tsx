"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useDict } from "@/i18n/client";
import type { OutreachTemplate } from "@/lib/data";
import { getToken, saveTrackerReferral } from "@/lib/githubClient";
import { fillTemplate, type KitJob } from "./ReferralKit";

export interface ColdTemplates {
  connect: OutreachTemplate | null; // LinkedIn 连接请求
  dm: OutreachTemplate | null; // LinkedIn 陌生人 DM
  friend: OutreachTemplate | null; // 熟人内推请求
}

type Path = "" | "linkedin" | "friend" | "giveup";

/** 解析 tracker Referral 列里的策略标记 → 展示 pill */
function decisionLabel(
  cell: string,
  t: ReturnType<typeof useDict>["coldOutreach"]
): { text: string; cls: string } | null {
  if (cell.includes("🔍")) return { text: t.pillSearching, cls: "pill blue" };
  if (cell.includes("🤝")) return { text: t.pillFriend, cls: "pill amber" };
  if (cell.includes("✖")) return { text: t.pillGiveup, cls: "pill gray" };
  return null;
}

/**
 * 缺内推公司的解决 flow：🔍 LinkedIn 冷启动（人脉搜索 + B 陌生人话术）/
 * 🤝 熟人（A 版话术）/ ✖️ 放弃 referral 直接网申。决策写回 tracker「Referral」列。
 */
export default function ColdOutreachKit({
  companyCell,
  name,
  currentReferralCell,
  jobs,
  templates,
}: {
  companyCell: string; // tracker 第一列原文（写回定位）
  name: string;
  currentReferralCell: string;
  jobs: KitJob[];
  templates: ColdTemplates;
}) {
  const d = useDict();
  const [open, setOpen] = useState(false);
  const [path, setPath] = useState<Path>("");
  const [canWrite, setCanWrite] = useState(false);
  const [decision, setDecision] = useState(currentReferralCell);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => setCanWrite(!!getToken()), []);

  const ranked = jobs
    .slice()
    .sort(
      (a, b) =>
        Number(!!b.pinned) - Number(!!a.pinned) ||
        b.stars + (b.hot ? 3 : 0) - (a.stars + (a.hot ? 3 : 0))
    );
  const [sel, setSel] = useState<number[]>(() => {
    const pinnedIdx = ranked.map((j, i) => (j.pinned ? i : -1)).filter((i) => i >= 0);
    return pinnedIdx.length ? pinnedIdx : ranked.slice(0, 1).map((_, i) => i);
  });
  const picked = sel.map((i) => ranked[i]).filter(Boolean);

  const today = () => new Date().toISOString().slice(0, 10);
  const mark = async (val: string, note: string) => {
    if (!canWrite || busy) return;
    setBusy(true);
    setMsg(d.coldOutreach.writing);
    try {
      await saveTrackerReferral(companyCell, name, val);
      setDecision(val);
      setMsg(d.coldOutreach.writeOk(note));
    } catch (e) {
      setMsg(d.coldOutreach.writeFail(e instanceof Error ? e.message : d.coldOutreach.writeFailDefault));
    } finally {
      setBusy(false);
    }
  };

  const copy = async (what: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(""), 2500);
    } catch {
      setCopied("✗");
    }
  };

  const searchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(
    name + " data scientist"
  )}`;
  const pill = decisionLabel(decision, d.coldOutreach);

  const jobPicker = ranked.length > 0 && (
    <>
      <div className="small" style={{ fontWeight: 650, margin: "8px 0 2px" }}>
        {d.coldOutreach.jobPickHeading}
      </div>
      <ul className="task-list">
        {ranked.map((j, i) => (
          <li key={i} className="today-task">
            <input
              type="checkbox"
              checked={sel.includes(i)}
              onChange={() =>
                setSel((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]))
              }
            />
            <span>
              {j.pinned ? "📌" : ""}
              {j.hot ? "🎯" : ""}
              {"⭐".repeat(j.stars)} {j.title}
              {j.location ? <span className="muted">（{j.location}）</span> : null}
            </span>
          </li>
        ))}
      </ul>
    </>
  );

  const textBlock = (label: string, tpl: OutreachTemplate | null) => {
    if (!tpl) return null;
    const text = fillTemplate(tpl.body, picked, name);
    return (
      <div style={{ marginTop: 8 }}>
        <div className="small" style={{ fontWeight: 650 }}>
          {label} <span className="muted">{tpl.to}</span>{" "}
          <button className="btn mini ghost" onClick={() => copy(label, text)}>
            {copied === label ? d.coldOutreach.copied : d.coldOutreach.copy}
          </button>
        </div>
        <textarea className="field" key={text} rows={6} defaultValue={text} />
      </div>
    );
  };

  return (
    <>
      {pill && <span className={pill.cls}>{pill.text}</span>}
      <button className="btn mini ghost" onClick={() => setOpen(true)}>
        {d.coldOutreach.solveBtn}
      </button>
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="modal-mask" onClick={() => setOpen(false)}>
            <div className="modal" style={{ width: 620 }} onClick={(e) => e.stopPropagation()}>
              <div className="card-title">
                {d.coldOutreach.modalTitle(name)}
                <span className="more">
                  <button className="btn mini ghost" onClick={() => setOpen(false)}>
                    {d.coldOutreach.close}
                  </button>
                </span>
              </div>
              <div className="chips">
                <button
                  className={`chip ${path === "linkedin" ? "on" : ""}`}
                  onClick={() => setPath("linkedin")}
                >
                  {d.coldOutreach.chipLinkedin}
                </button>
                <button
                  className={`chip ${path === "friend" ? "on" : ""}`}
                  onClick={() => setPath("friend")}
                >
                  {d.coldOutreach.chipFriend}
                </button>
                <button
                  className={`chip ${path === "giveup" ? "on" : ""}`}
                  onClick={() => setPath("giveup")}
                >
                  {d.coldOutreach.chipGiveup}
                </button>
              </div>

              {path === "" && (
                <p className="muted small">
                  {d.coldOutreach.intro}
                </p>
              )}

              {path === "linkedin" && (
                <>
                  <p className="small" style={{ margin: "4px 0" }}>
                    <a className="btn mini" href={searchUrl} target="_blank" rel="noreferrer">
                      {d.coldOutreach.searchBtn(name)}
                    </a>{" "}
                    <span className="muted small">
                      {d.coldOutreach.searchHint}
                    </span>
                  </p>
                  {jobPicker}
                  {textBlock(d.coldOutreach.connectLabel, templates.connect)}
                  {textBlock(d.coldOutreach.dmLabel, templates.dm)}
                  <button
                    className="btn"
                    style={{ marginTop: 8 }}
                    disabled={!canWrite || busy}
                    title={canWrite ? "" : d.coldOutreach.needTokenTitle}
                    onClick={() => mark(`🔍LinkedIn找人中(${today()})`, d.coldOutreach.noteSearching)}
                  >
                    {d.coldOutreach.markSearching}
                  </button>
                </>
              )}

              {path === "friend" && (
                <>
                  {jobPicker}
                  {textBlock(d.coldOutreach.friendLabel, templates.friend)}
                  <p className="muted small">{d.coldOutreach.friendHint}</p>
                  <button
                    className="btn"
                    disabled={!canWrite || busy}
                    onClick={() => mark(`🤝熟人引荐中(${today()})`, d.coldOutreach.noteFriend)}
                  >
                    {d.coldOutreach.markFriend}
                  </button>
                </>
              )}

              {path === "giveup" && (
                <>
                  <p className="small">
                    {d.coldOutreach.giveupText}
                  </p>
                  <button
                    className="btn"
                    disabled={!canWrite || busy}
                    onClick={() =>
                      mark(`✖️放弃内推·直接网申(${today()})`, d.coldOutreach.noteGiveup)
                    }
                  >
                    {d.coldOutreach.markGiveup}
                  </button>
                </>
              )}

              {msg && <div className="save-msg">{msg}</div>}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
