"use client";

import { useEffect, useState } from "react";
import { useDict } from "@/i18n/client";

/**
 * 时间感知问候语（客户端算，避免静态构建过期）。sub = 数据派生的一句鼓励。
 * owner / motto 由服务端（getSiteConfig）注入 —— 身份一律走配置，不写死（去标识化铁律）。
 */
export default function Greeting({ sub, owner, motto }: { sub: string; owner: string; motto: string }) {
  const d = useDict().greeting;
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);

  const hour = now ? now.getHours() : 9;
  const hello = !now
    ? d.helloDefault
    : hour < 5
    ? d.helloLateNight
    : hour < 11
    ? d.helloMorning
    : hour < 14
    ? d.helloNoon
    : hour < 18
    ? d.helloAfternoon
    : d.helloEvening;
  const kicker = now ? `${d.kickerPrefix}${d.dow[now.getDay()]}` : d.kickerFallback;

  return (
    <div className="greeting">
      <div className="kicker">{kicker}</div>
      <h1>
        {d.headPre(hello, owner)}
        <span className="accent">{motto}</span>
        {d.headPost}
      </h1>
      <p>{sub}</p>
    </div>
  );
}
