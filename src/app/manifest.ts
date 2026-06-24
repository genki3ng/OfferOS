import type { MetadataRoute } from "next";
import { getSiteConfig } from "@/lib/data";

/** PWA 清单：让指挥台可「加到主屏」、全屏 standalone 启动（边走边查/边学）。
 *  名称走 getSiteConfig()（data/profile.json + site.config.ts），不写死身份。
 *  图标见 app/icon.svg（favicon）、app/apple-icon.png（iOS）、public/icons/*（Android/maskable）。 */
export default function manifest(): MetadataRoute.Manifest {
  const cfg = getSiteConfig();
  return {
    name: `${cfg.appName} · 求职指挥台`,
    short_name: cfg.appName,
    description: "求职 end-to-end 指挥台：今日、公司、备战、Offers、时间线",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "zh-CN",
    background_color: "#fbf7f2",
    theme_color: "#fbf7f2",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
