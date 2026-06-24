"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";
import { NAV, isNavActive } from "@/config/nav";

/** 手机端底部 Tab 栏：拇指可达的 5 槽（今日/公司/备战/练习/更多），「更多」拉起底部 sheet 放其余去处。
 *  与桌面 TopNav 共用 @/config/nav 唯一真源 → 标签/图标/顺序对齐。桌面端整组 display:none（见 globals.css）。 */

// primary = 底部 Tab 常驻槽；其余（desktop + more）= 「更多」sheet
const PRIMARY = NAV.filter((n) => n.tier === "primary");
const MORE = NAV.filter((n) => n.tier !== "primary");

export default function TabBar() {
  const pathname = usePathname() || "/";
  const [sheet, setSheet] = useState(false);
  if (pathname === "/login") return null;

  const active = (it: (typeof NAV)[number]) => isNavActive(it, pathname);
  const moreActive = MORE.some(active);

  return (
    <>
      <nav className="tabbar" aria-label="主导航">
        {PRIMARY.map((t) => {
          const on = active(t);
          return (
            <Link key={t.href} href={t.href} className={on ? "on" : ""} aria-current={on ? "page" : undefined}>
              {t.icon}
              {t.label}
            </Link>
          );
        })}
        <button
          type="button"
          className={moreActive || sheet ? "on" : ""}
          onClick={() => setSheet(true)}
          aria-haspopup="menu"
          aria-expanded={sheet}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="3" y="3" width="7" height="7" rx="1.6" /><rect x="14" y="3" width="7" height="7" rx="1.6" /><rect x="3" y="14" width="7" height="7" rx="1.6" /><rect x="14" y="14" width="7" height="7" rx="1.6" />
          </svg>
          更多
        </button>
      </nav>

      {sheet && (
        <>
          <div className="tab-sheet-mask" onClick={() => setSheet(false)} aria-hidden />
          <div className="tab-sheet" role="menu" aria-label="更多去处">
            <div className="grab" />
            <div className="sheet-head">更多去处</div>
            <div className="sheet-grid">
              {MORE.map((m) => (
                <Link key={m.href} href={m.href} className={active(m) ? "on" : ""} onClick={() => setSheet(false)} role="menuitem">
                  {m.icon}
                  {m.label}
                </Link>
              ))}
            </div>
            <div className="sheet-foot">
              <span className="lbl">主题</span>
              <ThemeToggle />
            </div>
          </div>
        </>
      )}
    </>
  );
}
