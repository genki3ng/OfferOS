"use client";

import { useEffect, useState } from "react";

const DOW = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

/** 时间感知问候语（客户端算，避免静态构建过期）。sub = 数据派生的一句鼓励。 */
export default function Greeting({ sub }: { sub: string }) {
  const [d, setD] = useState<Date | null>(null);
  useEffect(() => setD(new Date()), []);

  const hour = d ? d.getHours() : 9;
  const hello = !d ? "你好" : hour < 5 ? "夜深了" : hour < 11 ? "早安" : hour < 14 ? "午安" : hour < 18 ? "下午好" : "晚上好";
  const kicker = d ? `今日 · ${DOW[d.getDay()]}` : "今日";

  return (
    <div className="greeting">
      <div className="kicker">{kicker}</div>
      <h1>
        {hello}，Congyang。<span className="accent">稳住节奏，</span>今天就推进一件大事。
      </h1>
      <p>{sub}</p>
    </div>
  );
}
