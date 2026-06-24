import type { ReactNode } from "react";
import type { Dict } from "@/i18n/zh";

/** 全站导航的唯一真源 —— 桌面顶栏（TopNav）与手机底部 Tab 栏（TabBar）都从这里取，
 *  标签 / 图标 / 顺序不再各写一份、不会再漂移。标签走 i18n 字典键（labelKey → d.nav[key]）。
 *  tier：
 *    primary —— 求职日常 loop 核心，两端都常驻（桌面顶栏内联 + 手机 Tab 槽）
 *    desktop —— 桌面顶栏内联可容下；手机收进「更多」sheet
 *    more    —— 二级去处；桌面进「更多」下拉、手机进「更多」sheet
 *  设置(/settings) 另有顶栏头像快捷入口，故标 avatar:true（桌面下拉里不重复列）。 */

const svg = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {children}
  </svg>
);

export type NavTier = "primary" | "desktop" | "more";
export type NavItem = {
  href: string;
  labelKey: keyof Dict["nav"];
  icon: ReactNode;
  tier: NavTier;
  avatar?: boolean;
  match?: (p: string) => boolean;
};

export const NAV: NavItem[] = [
  { href: "/", labelKey: "today", tier: "primary", match: (p) => p === "/", icon: svg(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>) },
  { href: "/pipeline", labelKey: "companies", tier: "primary", match: (p) => p.startsWith("/pipeline") || p.startsWith("/companies"), icon: svg(<path d="M3 21V8l6-4 6 4v13M15 21V11l6 4v6M3 21h18M7 9v.01M7 13v.01M7 17v.01" />) },
  { href: "/prep", labelKey: "prep", tier: "primary", icon: svg(<path d="M12 2 9 9l-7 .5 5.5 4.5L5.5 21 12 17l6.5 4-2-7L22 9.5 15 9z" />) },
  { href: "/practice", labelKey: "practice", tier: "primary", icon: svg(<path d="M6.5 12h11M4 9.5v5M7.5 8v8M16.5 8v8M20 9.5v5" />) },
  { href: "/offers", labelKey: "offers", tier: "desktop", icon: svg(<><rect x="3" y="7" width="18" height="12" rx="1.5" /><path d="M3 7l3-4h12l3 4M9 12h6" /></>) },
  { href: "/timeline", labelKey: "timeline", tier: "desktop", match: (p) => p.startsWith("/timeline") || p.startsWith("/agenda"), icon: svg(<><path d="M4 6h16M4 12h16M4 18h10" /><circle cx="18" cy="18" r="1.6" fill="currentColor" stroke="none" /></>) },
  { href: "/referrals", labelKey: "referrals", tier: "more", icon: svg(<><circle cx="9" cy="7" r="3" /><path d="M2 21v-1a6 6 0 0 1 12 0v1M16 4a3 3 0 0 1 0 6M22 21v-1a6 6 0 0 0-4-5.6" /></>) },
  { href: "/jobs", labelKey: "jobs", tier: "more", icon: svg(<><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M2 13h20" /></>) },
  { href: "/intel", labelKey: "intel", tier: "more", icon: svg(<><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>) },
  { href: "/docs", labelKey: "docs", tier: "more", icon: svg(<><path d="M14 3v5h5" /><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /></>) },
  { href: "/settings", labelKey: "settings", tier: "more", avatar: true, icon: svg(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>) },
];

export const isNavActive = (it: NavItem, pathname: string) =>
  it.match ? it.match(pathname) : pathname.startsWith(it.href);

