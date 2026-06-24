"use client";

import { useEffect, useRef, useState } from "react";
import { getToken, saveTaskToggle } from "@/lib/githubClient";
import { useDict } from "@/i18n/client";

export interface TaskInfo {
  text: string;
  checked: boolean;
}

/**
 * 渲染 markdown HTML；若 localStorage 有 GitHub token，则把任务勾选框激活：
 * 点击 = 直接 commit 源文件（- [ ] ↔ - [x]）→ push main → 全站自动重建。
 * tasks 顺序 = 源文件中任务行顺序；taskOffset 用于"只渲染了文件的一段"的场景。
 */
export default function Prose({
  html,
  path,
  tasks = [],
  taskOffset = 0,
}: {
  html: string;
  path?: string;
  tasks?: TaskInfo[];
  taskOffset?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [msg, setMsg] = useState<string>("");
  const d = useDict();

  useEffect(() => {
    const root = ref.current;
    if (!root || !path || !tasks.length || !getToken()) return;
    const boxes = Array.from(
      root.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
    );
    if (boxes.length !== tasks.length) return; // 渲染与解析对不上就不激活，宁可只读
    const handlers: [HTMLInputElement, (e: Event) => void][] = [];
    boxes.forEach((box, i) => {
      box.disabled = false;
      box.style.cursor = "pointer";
      const onChange = async () => {
        const checked = box.checked;
        boxes.forEach((b) => (b.disabled = true));
        setMsg(d.prose.saving);
        try {
          await saveTaskToggle(path, taskOffset + i, tasks[i].text, checked);
          tasks[i].checked = checked;
          setMsg(d.prose.saved);
        } catch (e) {
          box.checked = !checked;
          setMsg(`✗ ${e instanceof Error ? e.message : d.prose.saveFailed}`);
        } finally {
          boxes.forEach((b) => (b.disabled = false));
          setTimeout(() => setMsg(""), 5000);
        }
      };
      box.addEventListener("change", onChange);
      handlers.push([box, onChange]);
    });
    return () =>
      handlers.forEach(([box, fn]) => box.removeEventListener("change", fn));
  }, [html, path, tasks, taskOffset, d]);

  return (
    <div>
      <article
        ref={ref}
        className="prose"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {msg && <div className="save-msg">{msg}</div>}
    </div>
  );
}
