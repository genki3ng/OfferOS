"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";

/** 手机端底部 Tab 栏：拇指可达的 5 槽（今日/公司/备战/练习/更多），「更多」拉起底部 sheet 放其余去处。
 *  桌面端整组 display:none（见 globals.css），顶栏导航照旧。 */

const svg = (children: React.ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {children}
  </svg>
);

type Item = { href: string; label: string; icon: React.ReactNode; match?: (p: string) => boolean };

const PRIMARY: Item[] = [
  { href: "/", label: "今日", icon: svg(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>), match: (p) => p === "/" },
  { href: "/pipeline", label: "公司", icon: svg(<path d="M3 21V8l6-4 6 4v13M15 21V11l6 4v6M3 21h18M7 9v.01M7 13v.01M7 17v.01" />), match: (p) => p.startsWith("/pipeline") || p.startsWith("/companies") },
  { href: "/prep", label: "备战", icon: svg(<path d="M12 2 9 9l-7 .5 5.5 4.5L5.5 21 12 17l6.5 4-2-7L22 9.5 15 9z" />) },
  { href: "/practice", label: "练习", icon: svg(<path d="M6.5 12h11M4 9.5v5M7.5 8v8M16.5 8v8M20 9.5v5" />) },
];

const MORE: Item[] = [
  { href: "/offers", label: "Offers", icon: svg(<><rect x="3" y="7" width="18" height="12" rx="1.5" /><path d="M3 7l3-4h12l3 4M9 12h6" /></>) },
  { href: "/timeline", label: "时间线", icon: svg(<><path d="M4 6h16M4 12h16M4 18h10" /><circle cx="18" cy="18" r="1.6" fill="currentColor" stroke="none" /></>) },
  { href: "/referrals", label: "内推", icon: svg(<><circle cx="9" cy="7" r="3" /><path d="M2 21v-1a6 6 0 0 1 12 0v1M16 4a3 3 0 0 1 0 6M22 21v-1a6 6 0 0 0-4-5.6" /></>) },
  { href: "/jobs", label: "岗位库", icon: svg(<><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M2 13h20" /></>) },
  { href: "/intel", label: "情报", icon: svg(<><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>) },
  { href: "/docs", label: "文档", icon: svg(<><path d="M14 3v5h5" /><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /></>) },
  { href: "/settings", label: "设置", icon: svg(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>) },
];

export default function TabBar() {
  const pathname = usePathname() || "/";
  const [sheet, setSheet] = useState(false);
  if (pathname === "/login") return null;

  const active = (it: Item) => (it.match ? it.match(pathname) : pathname.startsWith(it.href));
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
          {svg(<><rect x="3" y="3" width="7" height="7" rx="1.6" /><rect x="14" y="3" width="7" height="7" rx="1.6" /><rect x="3" y="14" width="7" height="7" rx="1.6" /><rect x="14" y="14" width="7" height="7" rx="1.6" /></>)}
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
