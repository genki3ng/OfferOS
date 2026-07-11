"use client";

import { useState } from "react";
import { useDict } from "@/i18n/client";

export interface LogStepItem {
  icon: string; // 步骤图标（状态 emoji），空则显示中性圆点
  html: string; // 已渲染好的行内 HTML
}

/** 日志式长句的结构化渲染：一步一行 + 状态图标；条数超限折叠成「+N 条」。
 *  与 splitLogSegments（lib/markdown）配套——tracker「下一步」「内推」等字段统一走这里。 */
export default function LogSteps({
  items,
  max = 3,
  className = "",
}: {
  items: LogStepItem[];
  max?: number;
  className?: string;
}) {
  const d = useDict();
  const [open, setOpen] = useState(false);
  const shown = open ? items : items.slice(0, max);
  const extra = items.length - max;

  return (
    <div className={`log-steps ${className}`}>
      <ul>
        {shown.map((it, i) => (
          <li key={i}>
            <span className="ls-ico" aria-hidden>{it.icon || "·"}</span>
            <span className="ls-txt" dangerouslySetInnerHTML={{ __html: it.html }} />
          </li>
        ))}
      </ul>
      {extra > 0 && (
        <button type="button" className="clamp-toggle" onClick={() => setOpen((o) => !o)}>
          {open ? d.common.collapse : d.common.moreCount(extra)}
        </button>
      )}
    </div>
  );
}
