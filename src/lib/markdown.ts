import { Marked } from "marked";
import fs from "fs";
import path from "path";
import { siteConfig } from "@/site.config";

const GITHUB_BLOB = `https://github.com/${siteConfig.githubRepo}/blob/main/`;

// 站内可浏览的目录/文件白名单（/docs/... 路由与链接改写共用）
export const DOC_DIRS = [
  "pipeline",
  "prep",
  "strategy",
  "intel",
  "profile",
  "log",
  "negotiation",
  "summary",
];
export const DOC_ROOT_FILES = ["HANDOFF.md", "README.md", "CLAUDE.md", "GETTING-STARTED.md", "SETUP.md", "AGENTS.md", "CHANGELOG.md"];

export function isAllowedDoc(relPath: string): boolean {
  const norm = path.posix.normalize(relPath);
  if (norm.startsWith("..") || path.posix.isAbsolute(norm)) return false;
  if (DOC_ROOT_FILES.includes(norm)) return true;
  return DOC_DIRS.some((d) => norm.startsWith(d + "/")) && norm.endsWith(".md");
}

/** 把仓库内 .md 相对链接映射成站内路由；映射不了的返回 GitHub 链接 */
export function resolveMdHref(href: string, baseDir: string): string {
  if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("#")) return href; // 外链/锚点
  const [p, hash] = href.split("#");
  if (!p.endsWith(".md")) {
    // 仓库内非 md 资源（截图等）→ GitHub
    const norm = path.posix.normalize(path.posix.join(baseDir, p));
    return norm.startsWith("..") ? href : GITHUB_BLOB + norm;
  }
  const norm = path.posix.normalize(path.posix.join(baseDir, p));
  const suffix = hash ? "#" + hash : "";
  const company = norm.match(/^pipeline\/companies\/([^/]+)\.md$/);
  if (company && !company[1].startsWith("_")) {
    return `/companies/${company[1]}${suffix}`;
  }
  if (isAllowedDoc(norm)) return `/docs/${norm.replace(/\.md$/, "")}${suffix}`;
  return GITHUB_BLOB + norm;
}

const m = new Marked({ gfm: true });

/**
 * 拆掉文档开头的 YAML frontmatter，返回 { data, body }。
 * 不引第三方（gray-matter）；只解析 `key: value` 行，够速备包/收件箱用。
 * 仅当确实解析出至少一个键时才剥离——避免把正文里合法的 `---` 分割线当成 frontmatter。
 * 修复：旧逻辑把整篇（含 frontmatter）丢给 marked，`---\n…\n---` 被当成 setext 大标题渲染。
 */
export function parseFrontmatter(md: string): {
  data: Record<string, string>;
  body: string;
} {
  const mm = md.match(/^﻿?---\r?\n([\s\S]*?)\r?\n---[ \t]*\r?\n?/);
  if (!mm) return { data: {}, body: md };
  const data: Record<string, string> = {};
  for (const line of mm[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z][\w-]*):[ \t]*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim().replace(/\s+#.*$/, ""); // 去行尾 YAML 注释
    const q = v.match(/^"(.*)"$/) || v.match(/^'(.*)'$/);
    if (q) v = q[1];
    data[kv[1]] = v.trim();
  }
  if (Object.keys(data).length === 0) return { data: {}, body: md };
  return { data, body: md.slice(mm[0].length) };
}

/** 整篇 markdown → HTML，并把仓库内链接改写为站内路由 */
export function renderMarkdown(md: string, baseDir: string): string {
  const html = m.parse(md) as string;
  return linkifyQuestionIds(
    rewriteLinks(styleCallouts(breakLongParagraphs(html)), baseDir)
  );
}

// 句子级换行：仓库里大量段落是「一行塞满 5、6 句」的笔记（句间只用句号 。 分隔），
// 网页上渲染成一坨文字墙。这里在渲染时把长段落按句末标点（。！？）拆成「一句一行」、
// 每个断点加一点行距 → 文字墙变成清爽、可扫读的要点列表。
// 安全约束：① 只认全角句末标点 。！？——英文 "." 不动（避免小数 3.2 / 缩写 e.g. / 邮件正文被误拆）；
// ② 复用 PROTECTED_RE 只在「文本段」里拆，绝不动 <pre>/<code>/<a>/标签内部与属性；
// ③ 短段落（纯文本 <40 字）不拆，免得显得零碎。
// 句末标点（含其后的右括号/引号）后一律断行并吃掉随后的空白/换行——不靠「后面紧跟非空白」
// 的前瞻，否则句末标点紧贴 <strong>/<a>（文本段边界）或后接 marked 产生的 \n 时会漏断。
// 段末多余的那个断行再裁掉。
const SENT_BREAK_RE = /([。！？]+[”’"'」』）)】》〉]*)\s*/g;

export function breakLongParagraphs(html: string): string {
  return html.replace(/<p>([\s\S]*?)<\/p>/g, (full, inner) => {
    const text = inner.replace(/<[^>]+>/g, "");
    if (text.length < 40) return full; // 短段落保持原样
    let broken = inner
      .split(PROTECTED_RE)
      // split 捕获组：奇数下标 = 受保护块/标签，原样保留；偶数下标 = 可拆的纯文本。
      // 断点插一个空的块级 <span class="sb">：它既换行、又用显式高度撑出句间空隙
      //（<br> 设 display:block 后 margin 不生效＝gap 仍只有一个行高，看不出分段——已实测）。
      .map((seg: string, i: number) =>
        i % 2 === 1 ? seg : seg.replace(SENT_BREAK_RE, '$1<span class="sb"></span>')
      )
      .join("");
    broken = broken.replace(/<span class="sb"><\/span>\s*$/, ""); // 去掉段末多余空隙
    return broken === inner ? full : `<p>${broken}</p>`;
  });
}

// 引用块 → 语义 callout：按「引用首字符的 emoji」着色（样式见 globals.css .callout-*）。
// 速备包/HANDOFF 等大量用 `> 🔴…/⚠️…/✅…/📌…` 标轻重缓急；着色后一眼分辨，
// 无 emoji 的普通引用回落中性灰，不再满屏珊瑚墙。emoji 一律用基础码位（裸字符），
// 这样带不带 variation selector(️) 都能 startsWith 命中。
const CALLOUT_CUES: [string, string[]][] = [
  ["danger", ["🔴", "🚩", "⚠", "❌", "🛑", "🚨", "⛔", "🔥"]],
  ["success", ["🟢", "✅", "💚", "👑", "🏆", "🎉", "🥇"]],
  ["warn", ["🟡", "🟠", "⏰", "⏳", "⚡", "📅"]],
  ["info", ["📌", "🔑", "💡", "🎯", "ℹ", "📋", "🗂", "📊", "🧭", "📨", "🔍", "📍", "➡", "🔗", "🗺", "📝"]],
];

function calloutType(inner: string): string | null {
  // 剥掉引用块开头的空白 + 首个 <p> + 可能包住 emoji 的行内强调标签，露出首字符
  let s = inner.replace(/^\s+/, "").replace(/^<p[^>]*>/, "").replace(/^\s+/, "");
  s = s.replace(/^(?:<(?:strong|em|b|i|code)>\s*)+/, "");
  for (const [type, cues] of CALLOUT_CUES) {
    for (const c of cues) if (s.startsWith(c)) return type;
  }
  return null;
}

/**
 * 把行首带 emoji 提示的引用块标成语义 callout（着色见 globals.css .callout-*）。
 * 只匹配最内层、不含嵌套的 blockquote（`(?!<\/?blockquote>)`），避免破坏 `> >` 嵌套引用。
 */
export function styleCallouts(html: string): string {
  return html.replace(
    /<blockquote>((?:(?!<\/?blockquote>)[\s\S])*?)<\/blockquote>/g,
    (full, inner) => {
      const t = calloutType(inner);
      return t ? `<blockquote class="callout callout-${t}">${inner}</blockquote>` : full;
    }
  );
}

/** 单行/单元格 markdown → 行内 HTML */
export function renderInline(md: string, baseDir = ""): string {
  const html = m.parseInline(md) as string;
  return linkifyQuestionIds(rewriteLinks(html, baseDir));
}

/* ---------- 日志式长句 → 结构化步骤（tracker「下一步」/「内推」等字段的排版出口） ----------
   这类字段是流水句：「🎉过首轮→终轮邀请(…)。✅已回信(…)；⏳等排期」——整段灌出来没版式。
   按「顶层 。；;」拆成步骤（括号内的分隔符不拆），行首 emoji 提出来当步骤图标，
   配 <LogSteps> 组件渲染成带图标的分行清单。 */
export interface LogSeg {
  icon: string; // 行首状态 emoji（✅🎉⏳…），无则空
  text: string; // 该步骤正文（markdown，交 renderInline）
}
export function splitLogSegments(raw: string): LogSeg[] {
  const s = (raw || "").trim();
  const parts: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of s) {
    if (ch === "（" || ch === "(" || ch === "[" || ch === "「") depth++;
    else if (ch === "）" || ch === ")" || ch === "]" || ch === "」") depth = Math.max(0, depth - 1);
    if (depth === 0 && (ch === "。" || ch === "；" || ch === ";")) {
      if (cur.trim()) parts.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts.map((t) => {
    const m2 = t.match(/^([\p{Extended_Pictographic}️‍]+)\s*/u);
    return m2 ? { icon: m2[1], text: t.slice(m2[0].length).trim() } : { icon: "", text: t };
  });
}

// 候选题号 token（宽松形状）；是否真链接由"题库里是否存在该 id"决定 → 零误报。
const QID_CANDIDATE = /\b[a-z]{2,6}-\d+\b/g;
// 受保护块：<pre>/<code>/既有 <a> 内部 + 任意标签本体（属性里）都不改写。
const PROTECTED_RE =
  /(<pre[\s\S]*?<\/pre>|<code[\s\S]*?<\/code>|<a\b[\s\S]*?<\/a>|<[^>]+>)/gi;

// 题库里真实存在的题号集合（构建时解析，记忆化）。数据驱动：不写死前缀，只链接真实题号。
// 同时扫扁平 prep/question-bank.md 与各角色 prep/<role>/question-bank.md（OfferOS 多角色布局）。
let _qids: Set<string> | null = null;
function questionIds(): Set<string> {
  if (_qids) return _qids;
  const ids = new Set<string>();
  const root = process.cwd();
  const banks = [path.join(root, "prep/question-bank.md")];
  try {
    for (const d of fs.readdirSync(path.join(root, "prep"), { withFileTypes: true })) {
      if (d.isDirectory())
        banks.push(path.join(root, "prep", d.name, "question-bank.md"));
    }
  } catch {
    /* 没 prep 目录就只用扁平路径 */
  }
  for (const f of banks) {
    try {
      const md = fs.readFileSync(f, "utf8");
      for (const mm of md.matchAll(/^###\s*\[([a-z]+-\d+)\]/gim)) ids.add(mm[1]);
    } catch {
      /* 文件不存在跳过 */
    }
  }
  _qids = ids;
  return _qids;
}

/**
 * 把正文里出现的题号（如 sql-11 / ab-01 / pd-01）变成跳到练习台对应题的链接
 * → /practice?q=<id>（练习台读 ?q= 直接打开该题）。
 * 速备包等文档里的题号清单从此可一键点进对应练习题。
 * 只链接题库里真实存在的题号；跳过 <pre>/<code>/<a> 内部与标签属性，避免破坏代码块、既有链接与 href。
 */
export function linkifyQuestionIds(html: string): string {
  const ids = questionIds();
  if (!ids.size) return html;
  return html
    .split(PROTECTED_RE)
    .map((seg, i) =>
      // split 捕获组：奇数下标 = 受保护块/标签，原样保留；偶数下标 = 可改写文本。
      i % 2 === 1
        ? seg
        : seg.replace(QID_CANDIDATE, (tok) =>
            ids.has(tok)
              ? `<a href="/practice?q=${tok}" class="qlink">${tok}</a>`
              : tok
          )
    )
    .join("");
}

function rewriteLinks(html: string, baseDir: string): string {
  return html
    .replace(/(<a[^>]*\shref=")([^"]+)(")/g, (_, pre, href, post) => {
      return pre + escapeAttr(resolveMdHref(decodeEntities(href), baseDir)) + post;
    })
    .replace(/(<img[^>]*\ssrc=")([^"]+)(")/g, (_, pre, src, post) => {
      const s = decodeEntities(src);
      if (/^[a-z][a-z0-9+.-]*:/i.test(s)) return pre + src + post;
      const norm = path.posix.normalize(path.posix.join(baseDir, s));
      // 仓库内图片走 GitHub raw（站点不打包仓库图片）
      return (
        pre +
        escapeAttr(
          `https://raw.githubusercontent.com/${siteConfig.githubRepo}/main/` + norm
        ) +
        post
      );
    });
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
