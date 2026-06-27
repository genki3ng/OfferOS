import type { Metadata, Viewport } from "next";
import Link from "next/link";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import AskClaude from "@/components/AskClaude";
import ThemeToggle from "@/components/ThemeToggle";
import TabBar from "@/components/TabBar";
import TopNav from "@/components/TopNav";
import LangToggle from "@/components/LangToggle";
import { getSiteConfig } from "@/lib/data";
import { getLocale, getDict } from "@/i18n/server";
import { LocaleProvider } from "@/i18n/client";
import "./globals.css";

/** 构建时读 package.json 版本号（单一来源；页脚显示「我在哪个版本」，配 CHANGELOG 跟进升级） */
function appVersion(): string {
  try {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8")
    );
    return pkg.version ? `v${pkg.version}` : "";
  } catch {
    return "";
  }
}

/** 构建时检测仓库壁纸（设置页上传后 commit 到 public/wallpaper.jpg）→ 全设备生效；内容 hash 做缓存戳 */
function repoWallpaper(): string {
  try {
    const buf = fs.readFileSync(path.join(process.cwd(), "public/wallpaper.jpg"));
    const v = crypto.createHash("sha1").update(buf).digest("hex").slice(0, 8);
    return `/wallpaper.jpg?v=${v}`;
  } catch {
    return "";
  }
}

export function generateMetadata(): Metadata {
  const cfg = getSiteConfig();
  return {
    title: { default: `${cfg.appName} · Job-hunt command center`, template: `%s · ${cfg.appName}` },
    description: `${cfg.ownerName}'s end-to-end job-hunt command center: Today, Companies, Prep, Offers, Timeline`,
    robots: { index: false, follow: false },
    manifest: "/manifest.webmanifest",
    appleWebApp: { capable: true, title: cfg.appName, statusBarStyle: "default" },
  };
}

// themeColor / viewport-fit 必须放在 viewport 导出里（Next 15）；viewport-fit=cover 启用安全区。
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf7f2" },
    { media: "(prefers-color-scheme: dark)", color: "#1f1b17" },
  ],
  viewportFit: "cover",
};

// 预绘制时定主题与壁纸，避免闪烁：jh_theme = light|dark（旧 glass/classic 值视为无效，回落到系统深浅）。
const THEME_INIT = `(function(){var d=document.documentElement;try{var t=localStorage.getItem("jh_theme");if(t!=="light"&&t!=="dark"){t=window.matchMedia&&matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}d.dataset.theme=t;var repo=d.dataset.repoWallpaper||"";var w=localStorage.getItem("jh_wallpaper");if(w&&repo&&localStorage.getItem("jh_wallpaper_synced")==="1"){localStorage.removeItem("jh_wallpaper");localStorage.removeItem("jh_wallpaper_synced");w=null;}var u=w||(localStorage.getItem("jh_wallpaper_off")==="1"?"":repo);if(u){d.style.setProperty("--wallpaper",'url("'+u.replace(/"/g,'\\\\"')+'")');d.dataset.wallpaper="1";}}catch(e){d.dataset.theme="light";}})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const wp = repoWallpaper();
  const ver = appVersion();
  const cfg = getSiteConfig();
  const locale = await getLocale();
  const d = await getDict();
  return (
    <html lang={locale === "zh" ? "zh-CN" : "en"} data-locale={locale} suppressHydrationWarning data-repo-wallpaper={wp || undefined}>
      <body>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
        <LocaleProvider locale={locale}>
          <div className="wallpaper-layer" aria-hidden />
          <header className="topbar">
            <div className="topbar-inner">
              <Link href="/" className="brand">
                <span className="mark" aria-hidden>
                  <svg width="20" height="20" viewBox="0 0 64 64" fill="currentColor">
                    <g transform="translate(32 32) scale(0.92) translate(-33 -27.8)">
                      <path d="M30 47 L45 29 L60 47 Z" opacity=".5" />
                      <path d="M6 47 L25 23 L41 47 Z" />
                      <path d="M25 8.6 Q26.2 11.8 29.4 13 Q26.2 14.2 25 17.4 Q23.8 14.2 20.6 13 Q23.8 11.8 25 8.6 Z" />
                    </g>
                  </svg>
                </span>
                {cfg.appName}
              </Link>
              <TopNav />
              <div className="nav-spacer" />
              <LangToggle />
              <ThemeToggle />
              <Link href="/settings" className="avatar" aria-label={d.nav.settingsAria} title={d.nav.settingsAria}>
                {cfg.ownerInitials}
              </Link>
            </div>
          </header>
          <main className="container">{children}</main>
          <AskClaude />
          <TabBar />
          <footer className="footer">
            {d.footer.source}{" "}
            <Link href="/start">{d.footer.startGuide}</Link> ·{" "}
            <a href={`https://github.com/${cfg.githubRepo}`} target="_blank" rel="noreferrer">
              {d.footer.github}
            </a>
            {ver && (
              <>
                {" "}·{" "}
                <Link href="/docs/CHANGELOG" title="更新日志 / 如何跟进升级">
                  OfferOS {ver}
                </Link>
              </>
            )}
          </footer>
        </LocaleProvider>
      </body>
    </html>
  );
}
