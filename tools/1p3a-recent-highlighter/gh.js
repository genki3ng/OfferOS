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

// 从 URL 提取稳定的帖子 ID。新版"会员专属版"(/interview/thread/N) 是 SPA，
// 切帖不更新 document.title → slug 会全部相同、同分钟两次截图撞名报错（GitHub 422）；
// 用 URL 里的帖子 ID 兜底，保证不同帖文件名一定唯一。
function pageIdFromUrl(url) {
  if (!url) return "";
  const m =
    url.match(/\/interview\/thread\/(\d+)/) || // 新版会员专属版 /interview/thread/123
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
  // 带上帖子 ID：新版 SPA 后台 document.title 不随帖切换，光靠 title slug 会重名撞文件；
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

  // v0.7：去噪正文抽取。新版"会员专享版"是 SPA（/interview/thread/N），整页没有
  // 干净的 <article>/<main> 包住正文 → 旧逻辑退回 document.body，把"左侧站点导航 +
  // 中栏相关帖列表(热门面试题) + 广告(ByteByteGo) + 关注卡 + 回复框"全抓进来，正文淹没在噪声里。
  // 这里克隆 body 后按"内容安全"的规则剥掉这些噪声块（每条规则都只命中明显的非正文，
  // 命中不了就保留，绝不误删正文），再交给 toMd。所有判定都不依赖会随改版变化的 class 名。
  function cleanForExtraction(srcBody) {
    const body = srcBody.cloneNode(true);
    const STAMP = /\d{4}\s*[（(]\s*\d{1,2}\s*[-–]\s*\d{1,2}\s*月\s*[)）]/; // 年份+季度，如 2026(4-6月)
    // 1p3a 帖子的"就业状态"元信息——只在版块/相关帖卡片里出现，正文/时间线散文几乎不会有；
    // 要"年份季度 + 就业状态"同时出现才算相关帖卡片，避免误把正文里"2026(1-3月)我面了…"当卡片删掉。
    const CARD_META = /(在职跳槽|在校学生|应届毕业|海外身份|本科在读|硕士在读|博士在读|全职@|实习@|兼职@)/;
    const AD_MARK = ["ByteByteGo", "看图就懂", "独家折扣", "折扣码"]; // 广告专有词
    const isAd = (t) => /link\.1p3a\.com/i.test(t) || AD_MARK.filter((m) => t.indexOf(m) >= 0).length >= 2;
    // 关注卡："2k+个主题 | 24k+个回复" / "帖子 2000 · 回复 24000"——主题/帖子 + 回复 + ≥2 个数字
    const isWidget = (t) => /(主题|帖子|讨论)/.test(t) && /(回复|评论)/.test(t) && (t.match(/\d[\d.,kK万+]*/g) || []).length >= 2;
    const HOT = /热门面试题|热门题目|相关(帖子|主题|面经|讨论)|你可能(感兴趣|还想看)|更多(面经|讨论)/;
    const NAV_KEYS = ["热门题目精选","面试经验","普通面经","数科面经","PM面经","面试攻略","薪资数据库","最新招聘职位","系统设计","公司库","关注的公司","淘专辑","阅读历史","帮助与客服","购买通行证","功能介绍"];
    const JUNK = ["Toggle Sidebar","会员专享版","一亩三分地面经","没有更多了","请输入回复内容","切换至高级模式","写长回复? 切换至高级模式","加载更多","展开全部","收起","举报","分享","点赞","沙发","板凳"];

    const tlen = (el) => (el.textContent || "").replace(/\s+/g, "").length;
    const all = () => Array.from(body.querySelectorAll("*"));
    // NB: body 是 cloneNode 出来的"游离子树"——节点的 isConnected 恒为 false（它指
    // "连到 document"），所以判活/判删一律走 body.contains / parentNode，别用 isConnected。
    const drop = (el) => { if (el && el !== body && el.parentNode) el.parentNode.removeChild(el); };
    const linkDensity = (el) => {
      const total = tlen(el) || 1;
      let l = 0;
      el.querySelectorAll("a").forEach((a) => { l += (a.textContent || "").replace(/\s+/g, "").length; });
      return l / total;
    };
    const stampedKids = (el) => {
      let c = 0;
      for (const ch of el.children) {
        const tx = ch.textContent || "";
        if (STAMP.test(tx) && CARD_META.test(tx)) c++; // 同时像"年份季度 + 就业状态"才算相关帖卡片
      }
      return c;
    };
    const navHits = (txt) => NAV_KEYS.reduce((n, k) => n + (txt.indexOf(k) >= 0 ? 1 : 0), 0);
    // 删"命中且不超过 cap 的【最内层】块"——只取最贴合噪声的那一层，绝不顺着往上删到
    // 把正文也包住的祖先（短帖时祖先文本也可能 < cap，外层删法会误删整段正文）。
    const removeInnermost = (test, cap) => {
      const hits = all().filter((e) => body.contains(e) && tlen(e) <= cap && test(e));
      hits.forEach((e) => { if (!hits.some((h) => h !== e && e.contains(h))) drop(e); });
    };
    // 删"命中且不超过 cap 的【最外层】小块"——仅用于 cap 很小的纯 UI 标签（整块都是噪声）。
    const removeOutermost = (test, cap) => {
      const hits = all().filter((e) => body.contains(e) && tlen(e) <= cap && test(e));
      const set = new Set(hits);
      hits.forEach((e) => { if (!set.has(e.parentElement)) drop(e); });
    };
    const hasAdLink = (e) => !!(e.querySelector && e.querySelector('a[href*="link.1p3a.com"]'));

    // 1) 结构性非正文标签：脚本/样式/导航/表单/按钮/媒体/页脚
    all().forEach((e) => {
      if (body.contains(e) && /^(SCRIPT|STYLE|NOSCRIPT|IFRAME|SVG|CANVAS|NAV|FORM|BUTTON|INPUT|SELECT|TEXTAREA|VIDEO|AUDIO|FOOTER)$/.test(e.tagName)) drop(e);
    });
    // 2) ARIA 角色：导航/页眉/页脚/侧栏/搜索/弹窗/菜单
    all().forEach((e) => {
      if (!body.contains(e) || !e.getAttribute) return;
      if (/^(navigation|banner|contentinfo|complementary|search|dialog|menu|menubar|toolbar|tablist|tab|form)$/i.test(e.getAttribute("role") || "")) drop(e);
      if (e.getAttribute("aria-hidden") === "true") drop(e);
    });
    // 3) 相关帖列表（中栏"热门面试题"）：有 ≥3 个直接子元素各自带 1p3a 帖子标签的容器
    //    （正文的 meta 行只有 1 个标签；评论区没有标签 → 都不会被误删）
    all().forEach((e) => {
      if (body.contains(e) && e.children.length >= 3 && stampedKids(e) >= 3) drop(e);
    });
    // 4) 相关帖小标题（"…热门面试题 31 题"）：删标题本身，并连带删它后面的列表容器
    //    （兜底无 1p3a 标签的相关帖列表——靠"标题 + 紧跟的多项列表"识别）
    all().forEach((e) => {
      if (!body.contains(e) || tlen(e) >= 60 || !HOT.test(e.textContent || "")) return;
      const sib = e.nextElementSibling;
      if (sib && sib.children.length >= 3) drop(sib);
      drop(e);
    });
    // 5) 链接堆（站点导航渲染成一串链接）：≥3 个链接、文本短、链接密度高
    all().forEach((e) => {
      if (!body.contains(e)) return;
      if (e.querySelectorAll("a").length >= 3 && tlen(e) < 1000 && linkDensity(e) >= 0.55) drop(e);
    });
    // 6) 残留的纯文本站点导航：短块里凑齐 ≥4 个导航专有词
    all().forEach((e) => {
      if (body.contains(e) && tlen(e) < 600 && navHits(e.textContent || "") >= 4) drop(e);
    });
    // 7) 广告/推广卡（多重广告专有词，或块内带 1p3a 推广跳转链接 link.1p3a.com；避免误删"顺嘴提一句"的正文）
    removeInnermost((e) => isAd(e.textContent || "") || hasAdLink(e), 600);
    // 8) 公司关注卡（"2k+个主题 | 24k+个回复" / "帖子 2000 · 回复 24000"）
    removeInnermost((e) => isWidget(e.textContent || ""), 220);
    // 9) 反应条/回复提示等纯 UI 小块（cap 很小，整块都是噪声）
    removeOutermost((e) => /我遇到过这个问题|写长回复|切换至高级模式|没有更多了/.test(e.textContent || ""), 80);
    // 10) 精确短标签
    all().forEach((e) => {
      if (!body.contains(e)) return;
      const tx = (e.textContent || "").trim();
      if (tx.length <= 30 && JUNK.some((j) => tx === j || tx.replace(/\s+/g, "") === j.replace(/\s+/g, ""))) drop(e);
    });
    return body;
  }

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
    const fullText = toMd(document.body).slice(0, 60000); // 全页文本（去噪结果的"上限"参照）
    const rawRoot = document.querySelector("article") || document.querySelector("main") || document.body;
    const rawText = toMd(rawRoot).slice(0, 60000);        // 旧行为：退回用的兜底
    let cleanText = "";
    try { cleanText = toMd(cleanForExtraction(document.body)).slice(0, 60000); } catch (e) { cleanText = ""; }
    const titleGuess = pickTitle();
    // 安全网：去噪结果要么明显抓到了正文（含标题，哪怕帖子很短；或够长）、且不超过全页文本，
    // 否则退回旧行为——绝不比从前更差。
    const cleanOk =
      cleanText.length <= fullText.length + 50 &&
      ((titleGuess && cleanText.indexOf(titleGuess) >= 0 && cleanText.length >= 60) ||
        cleanText.length >= 200);
    if (cleanOk) {
      text = cleanText;
      mode = "去噪正文(md)";
    } else {
      text = rawText;
      mode = (rawRoot.tagName === "BODY" ? "全页" : "正文区") + "(md)";
    }
  }

  // 新版"会员专属版"(/interview/) 是 SPA：切帖不更新 <title>，document.title 会停在上一帖。
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
