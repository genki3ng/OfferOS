/*
 * gh.js —— 弹窗(popup)与后台(background service worker)共享的 GitHub 提交逻辑。
 * popup.html 用 <script src="gh.js"> 加载；background 用 importScripts("gh.js") 加载。
 * 这里只放与环境无关的纯函数 + 用到的 chrome.* API（两边都有）。
 */

const GH_DEFAULTS = {
  ghOwner: "your-username",
  ghRepo: "your-repo",
  ghBranch: "main",
  ghPath: "inbox",
  ghToken: "",
};

function ghHeaders(token) {
  return {
    Authorization: "Bearer " + token,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

function getGhCfg() {
  return new Promise((resolve) =>
    chrome.storage.local.get(GH_DEFAULTS, (s) => {
      const c = { ...GH_DEFAULTS, ...s };
      c.ghBranch = c.ghBranch || "main";
      c.ghPath = (c.ghPath || "inbox").replace(/\/+$/, "");
      resolve(c);
    })
  );
}

// 取已存在文件的 sha（不存在返回 null）——GitHub Contents API 更新文件时必须带 sha
async function ghGetSha(cfg, path) {
  const url = `https://api.github.com/repos/${cfg.ghOwner}/${cfg.ghRepo}/contents/${path}?ref=${encodeURIComponent(cfg.ghBranch)}`;
  const res = await fetch(url, { headers: ghHeaders(cfg.ghToken) });
  if (res.status === 404) return null; // 新文件
  if (!res.ok) return null; // 取不到就当新建，让 PUT 去暴露真实错误
  const j = await res.json();
  return j && j.sha ? j.sha : null;
}

async function ghCommit(cfg, path, base64Content, message) {
  const url = `https://api.github.com/repos/${cfg.ghOwner}/${cfg.ghRepo}/contents/${path}`;
  const sha = await ghGetSha(cfg, path); // 文件已存在 → 带上 sha 走"更新"，否则 422
  const body = { message, content: base64Content, branch: cfg.ghBranch };
  if (sha) body.sha = sha;
  const res = await fetch(url, {
    method: "PUT",
    headers: { ...ghHeaders(cfg.ghToken), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`GitHub ${res.status} ${t.slice(0, 160)}`);
  }
  return res.json();
}

// 文件名安全的 slug：保留中英文与数字，其余转 -
function slugify(s) {
  return (s || "")
    .replace(/[\\/:*?"<>|#%&{}\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

// 从 URL 提取稳定的帖子 ID。某些论坛的"会员/专属版"详情页是 SPA，
// 切帖不更新 document.title → slug 会全部相同、同分钟两次截图撞名报错（GitHub 422）；
// 用 URL 里的帖子 ID 兜底，保证不同帖文件名一定唯一。
function pageIdFromUrl(url) {
  if (!url) return "";
  const m =
    url.match(/\/interview\/thread\/(\d+)/) || // SPA 详情页 /interview/thread/123
    url.match(/\/thread-(\d+)-/) ||            // Discuz 静态帖 thread-123-1-1.html
    url.match(/[?&]tid=(\d+)/);                // Discuz 动态帖 ?tid=123
  return m ? m[1] : "";
}

// 文件名时间戳：YYYY-MM-DD_HHMMSS（带秒，避免同分钟两次抓取撞文件名被互相覆盖）
function tsForName() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(
    d.getHours()
  )}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

// UTF-8 字符串 -> base64（分块避免栈溢出）
function textToB64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

function buildMarkdown(types, text, imageNote, pageInfo) {
  const fm = [
    "---",
    `captured_at: ${new Date().toISOString()}`,
    `source_url: ${pageInfo.url || ""}`,
    `source_title: ${JSON.stringify(pageInfo.title || "")}`,
    `type: [${types.join(", ")}]`,
    "tags: []        # 留给 Claude 填",
    "status: new     # Claude 处理后改 done",
    "---",
    "",
  ].join("\n");
  return fm + (text || "") + (imageNote || "") + "\n";
}

// 统一的保存入口：可带图片(image={base64,ext}) 和/或正文(text)
async function saveCapture({ types, text, image, pageInfo }) {
  const cfg = await getGhCfg();
  if (!cfg.ghToken) throw new Error("未配置 GitHub token（在弹窗里填）");
  const typeTag = (types && types.length ? types : ["other"]).join("+");
  const stamp = tsForName();
  const id = pageIdFromUrl(pageInfo.url);
  // 带上帖子 ID：SPA 详情页 document.title 不随帖切换，光靠 title slug 会重名撞文件；
  // 同一帖多次截图再靠时间戳秒级区分。
  const slug = [slugify(pageInfo.title) || "capture", id].filter(Boolean).join("_");
  const base = `${cfg.ghPath}/${stamp}_${typeTag}_${slug}`;

  let imageNote = "";
  if (image) {
    await ghCommit(cfg, `${base}.${image.ext}`, image.base64, `inbox: 截图 ${slug}`);
    imageNote = `\n\n![screenshot](${stamp}_${typeTag}_${slug}.${image.ext})\n`;
  }
  const md = buildMarkdown(types, text, imageNote, pageInfo);
  await ghCommit(cfg, `${base}.md`, textToB64(md), `inbox: ${typeTag} ${slug}`);
  return `${base}.md`;
}

// 注入页面执行：抓选中/帖子正文/文章 → **Markdown**（v0.6：保留超链接、标题、列表、表格）
function grabFromPage() {
  const SKIP = /^(SCRIPT|STYLE|NOSCRIPT|IFRAME|SVG|BUTTON|INPUT|SELECT|TEXTAREA|NAV|CANVAS)$/;
  const pipe = (s) => s.replace(/\|/g, "\\|");
  const abs = (h) => {
    try { return new URL(h, location.href).href; } catch (e) { return h; }
  };

  function inline(node) {
    let out = "";
    for (const n of node.childNodes) {
      if (n.nodeType === 3) { out += n.nodeValue.replace(/\s+/g, " "); continue; }
      if (n.nodeType !== 1 || SKIP.test(n.tagName)) continue;
      const t = n.tagName;
      if (t === "BR") { out += "\n"; continue; }
      if (t === "IMG") {
        const src = n.getAttribute("src");
        if (src && !src.startsWith("data:")) out += "![" + (n.alt || "img") + "](" + abs(src) + ")";
        continue;
      }
      const inner = inline(n);
      if (t === "A") {
        const href = n.getAttribute("href");
        const txt = inner.trim();
        if (href && !/^(javascript:|#)/.test(href) && txt) out += "[" + txt + "](" + abs(href) + ")";
        else out += inner;
      } else if (t === "STRONG" || t === "B") out += inner.trim() ? "**" + inner.trim() + "**" : "";
      else if (t === "EM" || t === "I") out += inner.trim() ? "*" + inner.trim() + "*" : "";
      else if (t === "CODE") out += inner.trim() ? "`" + inner.trim() + "`" : "";
      else out += inner;
    }
    return out;
  }

  function block(node, depth) {
    depth = depth || 0;
    if (node.nodeType === 3) return node.nodeValue.replace(/\s+/g, " ");
    if (node.nodeType !== 1 || SKIP.test(node.tagName)) return "";
    if (node.getAttribute && (node.getAttribute("hidden") !== null || node.getAttribute("aria-hidden") === "true")) return "";
    const t = node.tagName;
    if (/^H[1-6]$/.test(t)) return "\n" + "#".repeat(+t[1]) + " " + inline(node).trim() + "\n";
    if (t === "P") { const s = inline(node).trim(); return s ? "\n" + s + "\n" : ""; }
    if (t === "PRE") return "\n```\n" + node.innerText.trim() + "\n```\n";
    if (t === "HR") return "\n---\n";
    if (t === "BLOCKQUOTE") {
      const s = toMdInner(node, depth).trim();
      return s ? "\n" + s.split("\n").map((l) => "> " + l).join("\n") + "\n" : "";
    }
    if (t === "UL" || t === "OL") {
      let i = 0, out = "\n";
      for (const li of node.children) {
        if (li.tagName !== "LI") continue;
        i++;
        let body = "", nested = "";
        for (const c of li.childNodes) {
          if (c.nodeType === 1 && (c.tagName === "UL" || c.tagName === "OL")) nested += block(c, depth + 1);
          else if (c.nodeType === 1 && /^(DIV|P|TABLE|H[1-6]|BLOCKQUOTE|PRE)$/.test(c.tagName)) body += block(c, depth + 1);
          else body += inline({ childNodes: [c] });
        }
        out += "  ".repeat(depth) + (t === "OL" ? i + ". " : "- ") + body.replace(/\n+/g, " ").trim();
        if (nested.trim()) out += "\n" + nested.replace(/^\n+|\n+$/g, "").split("\n").map((l) => "  " + l).join("\n");
        out += "\n";
      }
      return out;
    }
    if (t === "TABLE") {
      const rows = Array.from(node.querySelectorAll("tr"))
        .map((tr) => Array.from(tr.children)
          .filter((c) => c.tagName === "TD" || c.tagName === "TH")
          .map((c) => pipe(inline(c).trim().replace(/\n+/g, " "))))
        .filter((r) => r.length);
      if (!rows.length) return "";
      let out = "\n| " + rows[0].join(" | ") + " |\n|" + rows[0].map(() => "---").join("|") + "|\n";
      for (const r of rows.slice(1)) out += "| " + r.join(" | ") + " |\n";
      return out;
    }
    return toMdInner(node, depth);
  }

  function toMdInner(node, depth) {
    let out = "";
    for (const c of node.childNodes) out += block(c, depth);
    if (/^(DIV|SECTION|ARTICLE|MAIN|HEADER|FOOTER|FIGURE|FIGCAPTION|DL|DD|DT|LI|TD|TH)$/.test(node.tagName) &&
        out.trim() && !out.endsWith("\n")) out += "\n";
    return out;
  }

  const toMd = (root) =>
    block(root).replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

  let text = "", mode = "";
  const sel = window.getSelection();
  if (sel && sel.rangeCount && sel.toString().trim()) {
    const box = document.createElement("div");
    box.appendChild(sel.getRangeAt(0).cloneContents());
    text = toMd(box) || sel.toString().trim();
    mode = "选中(md)";
  }
  if (!text) {
    const posts = document.querySelectorAll("td.t_f");
    if (posts.length) {
      text = Array.from(posts).map((p) => toMd(p)).join("\n\n----\n\n");
      mode = "本页帖子正文(md)";
    }
  }
  if (!text) {
    const root = document.querySelector("article") || document.querySelector("main") || document.body;
    text = toMd(root).slice(0, 60000);
    mode = (root.tagName === "BODY" ? "全页" : "正文区") + "(md)";
  }

  // SPA 详情页（如 /interview/）切帖不更新 <title>，document.title 会停在上一帖。
  // 优先从内容区抓当前帖的标题，抓不到再退回 document.title（旧版论坛页 title 本就准确）。
  function pickTitle() {
    if (!/\/interview\//.test(location.href)) return document.title;
    const scope = document.querySelector("main, article") || document.body;
    for (const sel of ["h1", "h2"]) {
      for (const el of scope.querySelectorAll(sel)) {
        const cs = getComputedStyle(el);
        if (cs.display === "none" || cs.visibility === "hidden") continue;
        const t = (el.textContent || "").replace(/\s+/g, " ").trim();
        if (t.length >= 3 && t.length <= 150 && !/^(一亩三分地|1Point3Acres)/i.test(t)) return t;
      }
    }
    return document.title;
  }

  return { text, mode, title: pickTitle(), url: location.href };
}
