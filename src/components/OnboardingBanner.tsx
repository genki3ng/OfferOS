"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const KEY = "jh_onboarding_dismissed";

/** 首页顶部「新手上路」横幅。看完点「知道了」后本地记住、不再出现（localStorage）。 */
export default function OnboardingBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => setShow(localStorage.getItem(KEY) !== "1"), []);
  if (!show) return null;
  return (
    <div
      className="card section"
      style={{
        display: "flex",
        gap: 16,
        alignItems: "center",
        flexWrap: "wrap",
        justifyContent: "space-between",
        borderLeft: "3px solid var(--accent, #5E9A78)",
      }}
    >
      <div style={{ flex: "1 1 280px", minWidth: 260 }}>
        <div className="card-title" style={{ marginBottom: 4 }}>
          👋 新手上路
        </div>
        <div className="muted small">
          这是一个「你 + Claude」协作的求职指挥台 —— 仓库里的 markdown 就是数据库，网站只是看板。三件事上手：
          ① 部署到 Vercel + 配密码/PAT；② 改 <code>src/site.config.ts</code> 填你的名字；
          ③ 把 <code>profile/</code> 里的样例换成你自己的，然后在 Claude Code 里说「读 CLAUDE.md 和 HANDOFF.md，开始帮我找工作」。
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <Link className="btn-primary" href="/start">
          看完整上手指南 →
        </Link>
        <button
          className="btn-ghost"
          onClick={() => {
            localStorage.setItem(KEY, "1");
            setShow(false);
          }}
        >
          知道了
        </button>
      </div>
    </div>
  );
}
