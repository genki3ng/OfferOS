"use client";

import { useEffect, useState } from "react";
import { getToken, saveTaskToggle } from "@/lib/githubClient";
import { useDict } from "@/i18n/client";

export interface TaskItem {
  idx: number; // 在源文件全部任务行中的序号（saveTaskToggle 定位用）
  text: string; // 源文件任务行原文（提交校验用）
  html?: string; // 渲染用 HTML（缺省 = 纯文本去 markdown 标记）
  checked: boolean; // 构建时状态
}

const strip = (s: string) =>
  s.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[*`]/g, "");

/**
 * 可双向勾选的任务列表（防误勾设计）：
 * - 打勾后任务留在原位划线显示，点勾选框即可撤销；
 * - 构建时已完成的折叠进「已完成」，同样可以取消勾选——误勾的永远找得回；
 * - 无 token 时只读。
 */
export default function TaskList({
  path,
  items,
  limit,
  doneLabel,
  emptyText,
}: {
  path: string;
  items: TaskItem[];
  limit?: number;
  doneLabel?: string;
  emptyText?: string;
}) {
  const dict = useDict().taskList;
  const label = doneLabel ?? dict.doneLabelDefault;
  const [canWrite, setCanWrite] = useState(false);
  const [live, setLive] = useState<Record<number, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => setCanWrite(!!getToken()), []);

  const isChecked = (t: TaskItem) => live[t.idx] ?? t.checked;

  const toggle = async (t: TaskItem) => {
    if (!canWrite || busy) return;
    const to = !isChecked(t);
    setBusy(true);
    setLive((d) => ({ ...d, [t.idx]: to }));
    setMsg(dict.submitting);
    try {
      await saveTaskToggle(path, t.idx, t.text, to);
      setMsg(to ? dict.doneMsg : dict.undoMsg);
    } catch (e) {
      setLive((d) => ({ ...d, [t.idx]: !to }));
      setMsg(dict.failMsg(e instanceof Error ? e.message : dict.failDefault));
    } finally {
      setBusy(false);
      setTimeout(() => setMsg(""), 6000);
    }
  };

  const row = (t: TaskItem) => (
    <li key={t.idx} className="today-task">
      <input
        type="checkbox"
        checked={isChecked(t)}
        disabled={!canWrite || busy}
        onChange={() => toggle(t)}
        title={canWrite ? dict.titleCanWrite : dict.titleReadOnly}
      />
      {t.html ? (
        <span
          className={isChecked(t) ? "task-done" : undefined}
          dangerouslySetInnerHTML={{ __html: t.html }}
        />
      ) : (
        <span className={isChecked(t) ? "task-done" : undefined}>
          {strip(t.text)}
        </span>
      )}
    </li>
  );

  const open = items.filter((t) => !t.checked);
  const done = items.filter((t) => t.checked);
  const show = limit ? open.slice(0, limit) : open;

  return (
    <div>
      {show.length ? (
        <ul className="task-list">{show.map(row)}</ul>
      ) : (
        emptyText && <p className="muted">{emptyText}</p>
      )}
      {limit && open.length > limit && (
        <p className="muted small">{dict.moreHidden(open.length - limit)}</p>
      )}
      {done.length > 0 && (
        <details className="fold">
          <summary>
            {dict.doneSummary(label, done.length)}
          </summary>
          <ul className="task-list">{done.map(row)}</ul>
        </details>
      )}
      {msg && <div className="save-msg">{msg}</div>}
    </div>
  );
}
