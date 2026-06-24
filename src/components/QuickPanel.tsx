"use client";

import { useEffect, useState } from "react";
import {
  getToken,
  saveTrackerNext,
  saveQuickNote,
} from "@/lib/githubClient";
import StatusCell from "@/app/pipeline/StatusCell";
import { useDict } from "@/i18n/client";

/** 公司详情页快改：状态 / 下一步（写 tracker.md 对应行）+ 快记（追加公司文件） */
export default function QuickPanel({
  slug,
  companyCell,
  companyName,
  status,
  next,
}: {
  slug: string;
  companyCell: string;
  companyName: string;
  status: string;
  next: string;
}) {
  const d = useDict();
  const [canWrite, setCanWrite] = useState(false);
  const [nextVal, setNextVal] = useState(next);
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => setCanWrite(!!getToken()), []);
  if (!canWrite) return null;

  const flash = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(""), 5000);
  };

  const saveNext = async () => {
    if (nextVal.trim() === next.trim() || busy) return;
    setBusy(true);
    try {
      await saveTrackerNext(companyCell, companyName, nextVal.trim());
      flash(d.quickPanel.nextSaved);
    } catch (e) {
      flash(`✗ ${e instanceof Error ? e.message : d.quickPanel.fail}`);
    } finally {
      setBusy(false);
    }
  };

  const saveNote = async () => {
    if (!note.trim() || busy) return;
    setBusy(true);
    try {
      await saveQuickNote(slug, note.trim());
      setNote("");
      flash(d.quickPanel.noteSaved);
    } catch (e) {
      flash(`✗ ${e instanceof Error ? e.message : d.quickPanel.fail}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card section quick-panel">
      <div className="card-title">{d.quickPanel.title}</div>
      <div className="quick-row">
        <label>{d.quickPanel.statusLabel}</label>
        <StatusCell companyCell={companyCell} companyName={companyName} status={status} />
      </div>
      <div className="quick-row">
        <label>{d.quickPanel.nextLabel}</label>
        <input
          className="field"
          value={nextVal}
          onChange={(e) => setNextVal(e.target.value)}
          placeholder={d.quickPanel.nextPlaceholder}
        />
        <button className="btn mini" onClick={saveNext} disabled={busy}>
          {d.quickPanel.save}
        </button>
      </div>
      <div className="quick-row">
        <label>{d.quickPanel.noteLabel}</label>
        <input
          className="field"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={d.quickPanel.notePlaceholder}
        />
        <button className="btn mini" onClick={saveNote} disabled={busy || !note.trim()}>
          {d.quickPanel.append}
        </button>
      </div>
      <p className="muted small" style={{ margin: "6px 0 0" }}>
        {d.quickPanel.hintPre}<code>⏰MM-DD</code>{d.quickPanel.hintMid}<a href="/timeline">{d.quickPanel.hintLink}</a>{d.quickPanel.hintPost}
      </p>
      {msg && <div className="save-msg">{msg}</div>}
    </div>
  );
}
