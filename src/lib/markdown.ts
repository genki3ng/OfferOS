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
  return linkifyQuestionIds(rewriteLinks(html, baseDir));
}

/** 单行/单元格 markdown → 行内 HTML */
export function renderInline(md: string, baseDir = ""): string {
  const html = m.parseInline(md) as string;
  return linkifyQuestionIds(rewriteLinks(html, baseDir));
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
