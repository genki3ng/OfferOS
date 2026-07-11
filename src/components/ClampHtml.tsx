"use client";

import { useEffect, useRef, useState } from "react";
import { useDict } from "@/i18n/client";

/** 长文折叠器：行内 markdown 渲染出的 HTML 超过 N 行就折叠 + 「展开/收起」。
 *  全站「原文长句灌进卡片/表格」的统一出口——别再直接 dangerouslySetInnerHTML 整段长文。 */
export default function ClampHtml({
  html,
  lines = 3,
  className = "",
}: {
  html: string;
  lines?: number;
  className?: string;
}) {
  const d = useDict();
  const ref = useRef<HTMLDivElement>(null);
  const [clamped, setClamped] = useState(true);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setOverflowing(el.scrollHeight > el.clientHeight + 2);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [html]);

  return (
    <div className={`clamp-wrap ${className}`}>
      <div
        ref={ref}
        className={`clamp-body${clamped ? " clamped" : ""}`}
        style={clamped ? ({ WebkitLineClamp: lines } as React.CSSProperties) : undefined}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {(overflowing || !clamped) && (
        <button type="button" className="clamp-toggle" onClick={() => setClamped((c) => !c)}>
          {clamped ? d.common.expand : d.common.collapse}
        </button>
      )}
    </div>
  );
}
