"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { NAV, isNavActive } from "@/config/nav";
import { useDict } from "@/i18n/client";

/** 桌面顶栏导航：primary + desktop 两档内联，其余（more，去掉头像已覆盖的设置）收进「更多」下拉。
 *  与手机 TabBar 共用 @/config/nav 唯一真源 + i18n 字典 → 标签/图标/顺序对齐。手机端整组隐藏（见 globals .nav）。 */
export default function TopNav() {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const d = useDict();

  const inline = NAV.filter((n) => n.tier === "primary" || n.tier === "desktop");
  const more = NAV.filter((n) => n.tier === "more" && !n.avatar);
  const moreActive = more.some((n) => isNavActive(n, pathname));

  // 「更多」菜单用 fixed 定位（坐标按按钮实时算），不再放在 .nav 的 overflow 盒子里——
  // 否则 overflow-x:auto 会把绝对定位的菜单裁掉、还冒出一条横向滚动条（旧 bug）。
  const place = () => {
    const b = btnRef.current?.getBoundingClientRect();
    if (!b) return;
    const W = 184; // 菜单宽度上限，靠右时夹住避免溢出视口
    setPos({ top: b.bottom + 6, left: Math.max(8, Math.min(b.left, window.innerWidth - W - 8)) });
  };
  const toggle = () => {
    if (!open) place();
    setOpen((o) => !o);
  };
  useEffect(() => {
    if (!open) return;
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <nav className="nav" aria-label={d.nav.primaryAria}>
      {inline.map((n) => {
        const on = isNavActive(n, pathname);
        return (
          <Link key={n.href} href={n.href} className={on ? "active" : ""} aria-current={on ? "page" : undefined}>
            {n.icon}
            {d.nav[n.labelKey]}
          </Link>
        );
      })}
      {more.length > 0 && (
        <div className="nav-more">
          <button
            ref={btnRef}
            type="button"
            className={`nav-more-btn${moreActive || open ? " active" : ""}`}
            onClick={toggle}
            aria-haspopup="menu"
            aria-expanded={open}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" />
            </svg>
            {d.nav.more}
          </button>
          {open && pos && (
            <>
              <div className="nav-more-mask" onClick={() => setOpen(false)} aria-hidden />
              <div
                className="nav-more-menu"
                role="menu"
                style={{ position: "fixed", top: pos.top, left: pos.left }}
              >
                {more.map((n) => (
                  <Link
                    key={n.href}
                    href={n.href}
                    role="menuitem"
                    className={isNavActive(n, pathname) ? "active" : ""}
                    onClick={() => setOpen(false)}
                  >
                    {n.icon}
                    {d.nav[n.labelKey]}
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
