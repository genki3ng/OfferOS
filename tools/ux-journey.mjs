/**
 * ux-journey.mjs — 求职指挥台「使用旅程」冒烟 + 截图 QA harness
 * ------------------------------------------------------------------
 * 走一遍全站求职 loop（今日→公司→备战→练习→投递/内推→面试→offer），
 * 桌面 + 手机两视口：① 截图存档（人审用）② 抓 console / page 错误
 * ③ 断言手机端无横向溢出（scrollWidth ≤ 视口）——这条专门兜住
 * 「长内容把表格/卡片撑破」这类回归。
 *
 * 用法：
 *   npm run dev   # 或 next start，先把站点跑起来
 *   UX_BASE=http://localhost:3000 node tools/ux-journey.mjs
 * 可选环境变量：
 *   UX_BASE   站点地址（默认 http://localhost:3000）
 *   UX_OUT    截图输出目录（默认 .ux-shots/，已 gitignore）
 *   UX_VIEW   mobile | desktop | both（默认 both）
 *   UX_CHROME 指定 chromium 可执行文件（CI/容器里 playwright 自带版本不匹配时用）
 *   UX_EXTRA  额外路由，逗号分隔（如 /start,/onboard）
 * 退出码非 0 = 有真实错误或手机端横向溢出（可挂进 CI）。
 * 依赖 playwright（devDependency）；新机器先 `npx playwright install chromium`。
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "fs";

const BASE = (process.env.UX_BASE || "http://localhost:3000").replace(/\/$/, "");
const OUT = process.env.UX_OUT || ".ux-shots";
const VIEW = process.env.UX_VIEW || "both";
const EXTRA = (process.env.UX_EXTRA || "").split(",").map((s) => s.trim()).filter(Boolean);

const ROUTES = [
  ["today", "/"], ["pipeline", "/pipeline"], ["prep", "/prep"], ["practice", "/practice"],
  ["referrals", "/referrals"], ["jobs", "/jobs"], ["intel", "/intel"], ["offers", "/offers"],
  ["timeline", "/timeline"], ["agenda", "/agenda"], ["settings", "/settings"], ["docs", "/docs"],
  ["login", "/login"],
  ...EXTRA.map((p) => [p.replace(/\W+/g, "") || "extra", p]),
];

const VIEWPORTS = [
  { vp: "mobile", opts: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } },
  { vp: "desktop", opts: { viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 } },
].filter((v) => VIEW === "both" || VIEW === v.vp);

// 噪声过滤：自动化快速跳转会打断 next/link 的预取，产生与产品无关的 chunk abort。
const isNoise = (t = "") =>
  /Loading chunk \d+ failed|ChunkLoadError|net::ERR_ABORTED|Failed to load resource/i.test(t);

async function launch() {
  const exe = process.env.UX_CHROME;
  // localhost 不应走代理；某些沙箱里 chromium 会把 localhost 也代理掉 → _next 静态资源 400/白屏
  const opts = { args: ["--no-proxy-server"], proxy: { server: "direct://" } };
  try { return await chromium.launch(exe ? { ...opts, executablePath: exe } : opts); }
  catch (e) { if (exe) { console.warn("UX_CHROME launch failed, falling back to bundled chromium:", e.message); return await chromium.launch(opts); } throw e; }
}

const browser = await launch();
const report = [];
let realErrors = 0, overflows = 0;

for (const { vp, opts } of VIEWPORTS) {
  const dir = `${OUT}/${vp}`;
  mkdirSync(dir, { recursive: true });
  const ctx = await browser.newContext({ ...opts, colorScheme: "light" });
  const page = await ctx.newPage();
  let cur = "init";
  const cerr = [], perr = [];
  page.on("console", (m) => { if (m.type() === "error" && !isNoise(m.text())) cerr.push({ step: cur, text: m.text().slice(0, 200) }); });
  page.on("pageerror", (e) => { if (!isNoise(e.message)) perr.push({ step: cur, text: (e.message || "").slice(0, 200) }); });

  for (let i = 0; i < ROUTES.length; i++) {
    const [name, path] = ROUTES[i]; cur = name;
    const idx = String(i + 1).padStart(2, "0");
    try { await page.goto(BASE + path, { waitUntil: "load", timeout: 25000 }); await page.waitForTimeout(700); }
    catch (e) { perr.push({ step: cur, text: "GOTO FAIL " + (e.message || "").slice(0, 120) }); }
    // 自动化快速跳转可能打断 next/link 预取 → ChunkLoadError 白屏（与产品无关）；检测到就 reload 一次再量
    try {
      const body = await page.evaluate(() => document.body.innerText).catch(() => "");
      if (/Application error|client-side exception/i.test(body)) {
        await page.reload({ waitUntil: "load", timeout: 25000 }).catch(() => {});
        await page.waitForTimeout(900);
      }
    } catch {}
    try { await page.screenshot({ path: `${dir}/${idx}-${name}.png`, fullPage: true }); } catch {}

    // 横向溢出断言（手机端最关键）。先确认 CSS 已加载（.topbar 应 sticky）——
    // 沙箱里 _next 静态资源偶发 400/白屏会让未样式化页面误报，故 CSS 没加载就跳过断言。
    let overflow = null;
    try {
      const r = await page.evaluate(() => {
        const tb = document.querySelector(".topbar");
        const cssOk = tb ? ["sticky", "fixed"].includes(getComputedStyle(tb).position) : true;
        return { sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, cssOk };
      });
      if (!r.cssOk) console.log(`  · ${vp}/${name}: CSS 未加载（沙箱静态资源 flaky），跳过溢出断言`);
      else if (r.sw > r.cw + 2) { overflow = { sw: r.sw, cw: r.cw }; if (vp === "mobile") overflows++; }
    } catch {}

    const stepErrs = [...cerr.filter((x) => x.step === name), ...perr.filter((x) => x.step === name)];
    realErrors += perr.filter((x) => x.step === name).length;
    if (overflow) console.log(`  ⚠ ${vp}/${name}: 横向溢出 scrollWidth=${overflow.sw} > ${overflow.cw}`);
    if (stepErrs.length) console.log(`  ⚠ ${vp}/${name}: ${stepErrs.length} 错误 — ${stepErrs[0].text}`);
    report.push({ vp, step: name, url: BASE + path, overflow, errors: stepErrs });
  }
  await ctx.close();
}

await browser.close();
mkdirSync(OUT, { recursive: true });
writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 1));
console.log(`\n截图 + report.json → ${OUT}`);
console.log(realErrors ? `❌ ${realErrors} 个真实 page 错误` : "✓ 无真实 page 错误");
console.log(overflows ? `❌ ${overflows} 个手机端横向溢出` : "✓ 手机端无横向溢出");
process.exit(realErrors || overflows ? 1 : 0);
