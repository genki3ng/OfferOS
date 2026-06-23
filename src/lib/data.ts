import fs from "fs";
import path from "path";
import {
  splitRow,
  parseTrackerMd,
  parseCompanyOpenings,
  type Tier,
  type TrackerRow,
  type CompanyOpening,
} from "./parse";

export type { Tier, TrackerRow, CompanyOpening, AppStatus } from "./parse";
export { parseTrackerMd, parseCompanyOpenings } from "./parse";

/** 仓库根 = Next 项目根（数据就是仓库里的 markdown，构建时读取） */
const ROOT = process.cwd();

export function readDoc(relPath: string): string | null {
  const abs = path.join(ROOT, relPath);
  if (!abs.startsWith(ROOT)) return null;
  try {
    return fs.readFileSync(abs, "utf8");
  } catch {
    return null;
  }
}

export function listDocs(relDir: string): string[] {
  const abs = path.join(ROOT, relDir);
  try {
    return fs
      .readdirSync(abs)
      .filter((f) => f.endsWith(".md"))
      .sort();
  } catch {
    return [];
  }
}

/* ---------- 通用 markdown 解析小工具 ---------- */

/** 把一段 markdown 里出现的所有表格解析成行（每行 = 单元格数组，已去表头分隔行） */
export function parseTables(md: string): string[][][] {
  const tables: string[][][] = [];
  let current: string[][] = [];
  for (const line of md.split("\n")) {
    const t = line.trim();
    if (t.startsWith("|") && t.endsWith("|")) {
      const cells = splitRow(t);
      if (cells.every((c) => /^:?-{2,}:?$/.test(c.trim()))) continue; // 分隔行
      current.push(cells);
    } else if (current.length) {
      tables.push(current);
      current = [];
    }
  }
  if (current.length) tables.push(current);
  return tables;
}


/** 取出某个 `## ` 标题（按前缀匹配）下的整段原文（到下一个同级标题为止） */
export function extractSection(md: string, headingPrefix: string): string | null {
  const lines = md.split("\n");
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("## ") && lines[i].slice(3).trim().startsWith(headingPrefix)) {
      start = i + 1;
      break;
    }
  }
  if (start < 0) return null;
  let end = lines.length;
  for (let i = start; i < lines.length; i++) {
    if (lines[i].startsWith("## ")) {
      end = i;
      break;
    }
  }
  return lines.slice(start, end).join("\n").trim();
}

/* ---------- Tracker（pipeline/tracker.md） ---------- */

export const TIER_LABEL: Record<Tier, string> = {
  1: "🥇 第一梯队",
  2: "🥈 第二梯队",
  3: "🥉 第三梯队（观察）",
};

/** tracker 数据源 = data/tracker.json（结构化）。读不到/解析失败时回退老的 tracker.md 解析。 */
export function getTracker(): TrackerRow[] {
  const raw = readDoc("data/tracker.json");
  if (raw) {
    try {
      const data = JSON.parse(raw) as {
        companies: Array<{
          name: string; slug: string | null; careers: string | null; role: string;
          tier: Tier; status: string; perm: string; referral: string; next: string;
        }>;
      };
      return (data.companies ?? []).map((c) => ({
        company: c.name,
        name: c.name,
        careers: c.careers ?? null,
        slug: c.slug ?? null,
        role: c.role ?? "",
        status: c.status ?? "",
        perm: c.perm ?? "",
        referral: c.referral ?? "",
        next: c.next ?? "",
        tier: (c.tier ?? 3) as Tier,
      }));
    } catch {
      /* JSON 坏了就回退 markdown */
    }
  }
  const md = readDoc("pipeline/tracker.md");
  return md ? parseTrackerMd(md) : [];
}

/* ---------- 公司文件与「当前 opening」聚合 ---------- */

export interface Opening extends CompanyOpening {
  company: string;
  slug: string;
  tier: Tier;
}

export function getCompanySlugs(): string[] {
  return listDocs("pipeline/companies")
    .filter((f) => !f.startsWith("_") && f.toLowerCase() !== "readme.md")
    .map((f) => f.replace(/\.md$/, ""));
}

export function getOpenings(): Opening[] {
  const tracker = getTracker();
  const bySlug = new Map(tracker.filter((r) => r.slug).map((r) => [r.slug!, r]));
  const out: Opening[] = [];
  for (const slug of getCompanySlugs()) {
    const md = readDoc(`pipeline/companies/${slug}.md`);
    if (!md) continue;
    const row = bySlug.get(slug);
    for (const o of parseCompanyOpenings(md)) {
      out.push({ ...o, company: row?.name ?? slug, slug, tier: row?.tier ?? 3 });
    }
  }
  return out;
}

/** 📌 投递清单里的岗（非排除），跨公司聚合 —— 首页/日程/pipeline 联动用 */
export function getPinnedOpenings(): Opening[] {
  return getOpenings().filter((o) => o.pinned && !o.excluded);
}

/* ---------- 内推渠道（pipeline/referrals.md） ---------- */

export interface ReferralRow {
  cells: string[];
}

export function getReferrals(): { header: string[]; rows: string[][] } {
  const md = readDoc("pipeline/referrals.md");
  if (!md) return { header: [], rows: [] };
  const tables = parseTables(md);
  // 取列数最多、行数最多的那张表 = 渠道主表
  let best: string[][] = [];
  for (const t of tables) {
    if (t.length > best.length && (t[0]?.length ?? 0) >= 6) best = t;
  }
  if (!best.length) return { header: [], rows: [] };
  return { header: best[0], rows: best.slice(1) };
}

/* ---------- 冲刺进度（prep/sprint-plan.md 勾选框） ---------- */

export interface Progress {
  done: number;
  total: number;
}

export function countCheckboxes(md: string): Progress {
  const done = (md.match(/^\s*[-*] \[[xX]\]/gm) || []).length;
  const open = (md.match(/^\s*[-*] \[ \]/gm) || []).length;
  return { done, total: done + open };
}

export function getSprintProgress(): Progress {
  const md = readDoc("prep/sprint-plan.md");
  return md ? countCheckboxes(md) : { done: 0, total: 0 };
}

/* ---------- JD 档案（intel/jd/） ---------- */

export interface JdMeta {
  file: string; // 不含 .md
  title: string;
  level: string;
  location: string;
  comp: string;
  flagged: string; // CONTRACT / ARCHIVED 等文件名标记
}

export function getJds(): JdMeta[] {
  return listDocs("intel/jd")
    .filter((f) => f.toLowerCase() !== "readme.md")
    .map((f) => {
      const md = readDoc(`intel/jd/${f}`) ?? "";
      const title =
        md.match(/^#\s+(.+)$/m)?.[1].replace(/^JD：?\s*/, "") ??
        f.replace(/\.md$/, "");
      const pick = (key: string) =>
        md.match(new RegExp(`^[-*] \\*\\*${key}\\*\\*[：:](.+)$`, "m"))?.[1].trim() ?? "";
      const flag = f.match(/-(CONTRACT|ARCHIVED|EXCLUDED)/i);
      return {
        file: f.replace(/\.md$/, ""),
        title,
        level: pick("级别"),
        location: pick("地点"),
        comp: pick("薪酬"),
        flagged: flag ? flag[1].toUpperCase() : "",
      };
    });
}

/* ---------- 日志（log/journal.md） ---------- */

export interface JournalEntry {
  title: string;
  date: string;
  body: string; // markdown
}

export function getJournal(): JournalEntry[] {
  const md = readDoc("log/journal.md");
  if (!md) return [];
  const entries: JournalEntry[] = [];
  const lines = md.split("\n");
  let cur: JournalEntry | null = null;
  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (cur) entries.push(cur);
      const title = line.slice(3).trim();
      cur = {
        title,
        date: title.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? "",
        body: "",
      };
    } else if (cur) {
      cur.body += line + "\n";
    }
  }
  if (cur) entries.push(cur);
  return entries.map((e) => ({ ...e, body: e.body.trim() }));
}

/* ---------- 备战笔记 ---------- */

export function getCompanyNotes(): string[] {
  return listDocs("prep/company-notes")
    .filter((f) => !f.startsWith("_") && f.toLowerCase() !== "readme.md")
    .map((f) => f.replace(/\.md$/, ""));
}

/* ---------- 文档索引（/docs） ---------- */

export interface DocGroup {
  dir: string;
  label: string;
  files: { rel: string; title: string }[];
}

/* ---------- 简历导出件（构建第一步 tools/build-resume-exports.mjs 生成） ---------- */

export interface ResumeExport {
  source: string; // 如 "profile/resume/master.md"
  label: string;
  docx: string; // 站内路径 /exports/…docx（密码门盖住）
  html: string;
}

/** 读 prebuild 产出的 manifest；没跑生成器（如 next dev）时优雅降级为空。 */
export function getResumeExports(): ResumeExport[] {
  const raw = readDoc("public/exports/manifest.json");
  if (!raw) return [];
  try {
    return (JSON.parse(raw).files as ResumeExport[]) ?? [];
  } catch {
    return [];
  }
}

const DOC_GROUPS: { dir: string; label: string }[] = [
  { dir: "strategy", label: "策略 Strategy" },
  { dir: "pipeline", label: "管道 Pipeline" },
  { dir: "prep", label: "备战 Prep" },
  { dir: "prep/stats-experimentation", label: "备战 · 统计与实验" },
  { dir: "prep/product-sense", label: "备战 · 产品 Sense" },
  { dir: "prep/sql-python", label: "备战 · SQL/Python" },
  { dir: "prep/behavioral", label: "备战 · 行为面" },
  { dir: "prep/company-notes", label: "备战 · 公司面经" },
  { dir: "prep/briefs", label: "备战 · 面前速备包" },
  { dir: "intel/jd", label: "情报 · JD 档案" },
  { dir: "profile", label: "定位 Profile" },
  { dir: "profile/resume", label: "定位 · 简历" },
  { dir: "negotiation", label: "谈判 Negotiation" },
  { dir: "log", label: "日志 Log" },
  { dir: "summary", label: "总结 Summary" },
];

export function getDocIndex(): DocGroup[] {
  const groups: DocGroup[] = [
    {
      dir: "",
      label: "根目录",
      files: ["GETTING-STARTED.md", "HANDOFF.md", "README.md", "CLAUDE.md"]
        .filter((f) => readDoc(f) !== null)
        .map((f) => ({ rel: f.replace(/\.md$/, ""), title: f })),
    },
  ];
  for (const g of DOC_GROUPS) {
    const files = listDocs(g.dir)
      .filter((f) => !f.startsWith("_"))
      .map((f) => {
        const rel = `${g.dir}/${f.replace(/\.md$/, "")}`;
        const md = readDoc(`${g.dir}/${f}`) ?? "";
        const title = md.match(/^#\s+(.+)$/m)?.[1] ?? f;
        return { rel, title };
      });
    if (files.length) groups.push({ dir: g.dir, label: g.label, files });
  }
  return groups;
}

/** 列出所有可静态化的文档路径（供 /docs/[...slug] generateStaticParams） */
export function getAllDocPaths(): string[][] {
  const out: string[][] = [];
  for (const g of getDocIndex()) {
    for (const f of g.files) out.push(f.rel.split("/"));
  }
  // companies 也可经 /docs 访问（链接改写一般会走 /companies，但兜底）
  for (const slug of getCompanySlugs()) {
    out.push(["pipeline", "companies", slug]);
  }
  return out;
}

/* ---------- HANDOFF 摘要 ---------- */

export interface HandoffSection {
  md: string;
  taskOffset: number; // 该段第一个任务行在全文件任务行中的序号（供打勾定位）
}

function sectionWithOffset(md: string, prefix: string): HandoffSection | null {
  const lines = md.split("\n");
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("## ") && lines[i].slice(3).trim().startsWith(prefix)) {
      start = i + 1;
      break;
    }
  }
  if (start < 0) return null;
  let end = lines.length;
  for (let i = start; i < lines.length; i++) {
    if (lines[i].startsWith("## ")) {
      end = i;
      break;
    }
  }
  return {
    md: lines.slice(start, end).join("\n").trim(),
    taskOffset: getTaskLines(lines.slice(0, start).join("\n")).length,
  };
}

export function getHandoffSections(): {
  updated: string;
  inProgress: HandoffSection | null;
  pending: HandoffSection | null;
} {
  const md = readDoc("HANDOFF.md") ?? "";
  const updated = md.match(/最后更新[：:](.+)/)?.[1].trim() ?? "";
  return {
    updated,
    inProgress: sectionWithOffset(md, "🔄"),
    pending: sectionWithOffset(md, "⏳"),
  };
}

/** HANDOFF「🔄 进行中」段的任务行 = 首页「求职主线」卡（idx = 全文件任务行序号，供打勾定位） */
export interface HandoffTodo {
  idx: number;
  text: string;
  checked: boolean;
}

export function getHandoffTodos(): HandoffTodo[] {
  const md = readDoc("HANDOFF.md") ?? "";
  const lines = md.split("\n");
  let start = -1;
  let end = lines.length;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("## ") && lines[i].slice(3).trim().startsWith("🔄")) {
      start = i + 1;
      break;
    }
  }
  if (start < 0) return [];
  for (let i = start; i < lines.length; i++) {
    if (lines[i].startsWith("## ")) {
      end = i;
      break;
    }
  }
  return getTaskLines(md)
    .map((t, idx) => ({ idx, text: t.text, checked: t.checked, line: t.line }))
    .filter((t) => t.line >= start && t.line < end)
    .map(({ idx, text, checked }) => ({ idx, text, checked }));
}

/** HANDOFF「⏳ 待用户决定」段：顶层 bullet；`~~` 开头 = 已拍板（首页过滤掉，只在全文可见）。标题 H2/H3 都认。 */
export function getHandoffPending(): { open: string[]; resolved: number } {
  const md = readDoc("HANDOFF.md") ?? "";
  const lines = md.split("\n");
  let start = -1;
  let level = 2;
  for (let i = 0; i < lines.length; i++) {
    const h = lines[i].match(/^(#{2,3}) (.*)$/);
    if (h && h[2].trim().startsWith("⏳")) {
      start = i + 1;
      level = h[1].length;
      break;
    }
  }
  if (start < 0) return { open: [], resolved: 0 };
  let end = lines.length;
  for (let i = start; i < lines.length; i++) {
    const h = lines[i].match(/^(#{2,3}) /);
    if (h && h[1].length <= level) {
      end = i;
      break;
    }
  }
  const section = lines.slice(start, end).join("\n");
  const bullets: string[] = [];
  let buf: string | null = null;
  const flush = () => {
    if (buf !== null) bullets.push(buf);
    buf = null;
  };
  for (const line of section.split("\n")) {
    const m = line.match(/^- (.*)$/);
    if (m) {
      flush();
      buf = m[1].trim();
    } else if (buf !== null && /^\s+\S/.test(line)) {
      buf += " " + line.trim();
    } else {
      flush();
    }
  }
  flush();
  const open = bullets.filter((b) => !b.startsWith("~~"));
  return { open, resolved: bullets.length - open.length };
}

/* ---------- 任务行（与 githubClient.findTaskLines 保持同一逻辑） ---------- */

export interface TaskLine {
  line: number;
  text: string;
  checked: boolean;
}

export function getTaskLines(md: string): TaskLine[] {
  const out: TaskLine[] = [];
  let inFence = false;
  md.split("\n").forEach((l, i) => {
    if (/^\s*(```|~~~)/.test(l)) inFence = !inFence;
    if (inFence) return;
    const m = l.match(/^(\s*(?:>\s*)?[-*] )\[([ xX])\] (.*)$/);
    if (m) out.push({ line: i, text: m[3].trim(), checked: m[2] !== " " });
  });
  return out;
}

/* ---------- inbox 待办队列 ---------- */

export interface InboxItem {
  file: string;
  title: string;
  type: string;
  kind: string;
  status: string;
  date: string;
}

export function getInboxQueue(): InboxItem[] {
  const items: InboxItem[] = [];
  for (const f of listDocs("inbox")) {
    if (f.toLowerCase() === "readme.md") continue;
    const md = readDoc(`inbox/${f}`) ?? "";
    const fm = md.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    // 值可能带行尾 YAML 注释（扩展模板写法：`status: new  # Claude 处理后改 done`）
    const pick = (key: string) => {
      const raw =
        fm?.[1].match(new RegExp(`^${key}:\\s*(.+)$`, "m"))?.[1].trim() ?? "";
      const quoted = raw.match(/^"(.*)"/);
      if (quoted) return quoted[1];
      return raw.replace(/\s+#.*$/, "").trim();
    };
    const status = pick("status");
    if (status !== "new") continue;
    items.push({
      file: f,
      title: pick("source_title") || md.match(/^#\s+(.+)$/m)?.[1] || f,
      type: pick("type").replace(/[[\]]/g, ""),
      kind: pick("kind"),
      status,
      date: f.match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? "",
    });
  }
  return items.reverse(); // 新的在前
}

/* ---------- 题库（prep/question-bank.md） ---------- */

export interface Question {
  id: string;
  category: string;
  q: string; // 题干（markdown，可多行）
  a: string; // 要点（markdown）
}

export function getQuestionBank(): Question[] {
  const md = readDoc("prep/question-bank.md");
  if (!md) return [];
  const out: Question[] = [];
  let category = "";
  let cur: Question | null = null;
  let inAnswer = false;
  const flush = () => {
    if (cur) {
      cur.q = cur.q.trim();
      cur.a = cur.a.trim();
      out.push(cur);
    }
    cur = null;
    inAnswer = false;
  };
  for (const line of md.split("\n")) {
    if (line.startsWith("## ")) {
      flush();
      category = line.slice(3).trim();
      continue;
    }
    const h = line.match(/^### \[([\w-]+)\]\s*(.*)$/);
    if (h) {
      flush();
      cur = { id: h[1], category, q: h[2], a: "" };
      continue;
    }
    if (!cur) continue;
    if (/^\*\*要点\*\*\s*$/.test(line.trim())) {
      inAnswer = true;
      continue;
    }
    if (inAnswer) cur.a += line + "\n";
    else cur.q += "\n" + line;
  }
  flush();
  return out;
}

/* ---------- 练习日志（prep/practice-log.md） ---------- */

export interface PracticeRecord {
  time: string;
  qid: string;
  grade: string;
  note: string;
}

export function getPracticeLog(): PracticeRecord[] {
  const md = readDoc("prep/practice-log.md");
  if (!md) return [];
  const out: PracticeRecord[] = [];
  for (const t of parseTables(md)) {
    for (const row of t.slice(1)) {
      if (row.length >= 3 && /^\d{4}-\d{2}-\d{2}/.test(row[0])) {
        out.push({
          time: row[0],
          qid: row[1],
          grade: row[2],
          note: row[3] ?? "",
        });
      }
    }
  }
  return out;
}

/* ---------- 冲刺周计划（今日聚焦卡） ---------- */

export interface SprintTask {
  idx: number; // 在 sprint-plan.md 全部任务行中的序号（与 saveTaskToggle 对应）
  text: string;
  checked: boolean;
}

export interface SprintWeek {
  title: string; // 如 "Week 2（6/10–6/16）：深度（因果 + 诊断）"
  start: string; // ISO 日期
  end: string;
  tasks: SprintTask[];
}

export function getSprintWeeks(): { weeks: SprintWeek[]; parallel: SprintTask[] } {
  const md = readDoc("prep/sprint-plan.md");
  if (!md) return { weeks: [], parallel: [] };
  const lines = md.split("\n");
  const weeks: SprintWeek[] = [];
  const parallel: SprintTask[] = [];
  let bucket: SprintTask[] | null = null;
  let taskIdx = -1;
  let inFence = false;
  for (const l of lines) {
    if (/^\s*(```|~~~)/.test(l)) inFence = !inFence;
    if (inFence) continue;
    if (l.startsWith("## ")) {
      const w = l.match(/^## (Week \d+（(\d+)\/(\d+)–(\d+)\/(\d+)）.*)$/);
      if (w) {
        const year = 2026;
        const week: SprintWeek = {
          title: w[1].trim(),
          start: `${year}-${w[2].padStart(2, "0")}-${w[3].padStart(2, "0")}`,
          end: `${year}-${w[4].padStart(2, "0")}-${w[5].padStart(2, "0")}`,
          tasks: [],
        };
        weeks.push(week);
        bucket = week.tasks;
      } else if (l.includes("并行轨")) {
        bucket = parallel;
      } else {
        bucket = null;
      }
      continue;
    }
    const m = l.match(/^(\s*(?:>\s*)?[-*] )\[([ xX])\] (.*)$/);
    if (m) {
      taskIdx++;
      bucket?.push({ idx: taskIdx, text: m[3].trim(), checked: m[2] !== " " });
    }
  }
  return { weeks, parallel };
}

/* ---------- 日程聚合（/agenda） ---------- */

export interface AgendaItem {
  date: string; // YYYY-MM-DD
  label: string; // 渲染用 markdown
  company: string;
  slug: string | null;
  source: string; // 来源文件相对路径
}

const DATE_RE = /\d{4}-\d{2}-\d{2}/;

export function getAgenda(): AgendaItem[] {
  const out: AgendaItem[] = [];
  const tracker = getTracker();

  // 1) 公司文件「关键日期」段：表格行或 bullet 里带 YYYY-MM-DD 的条目
  for (const slug of getCompanySlugs()) {
    const md = readDoc(`pipeline/companies/${slug}.md`);
    if (!md) continue;
    const section = extractSection(md, "关键日期");
    if (!section) continue;
    const name = tracker.find((r) => r.slug === slug)?.name ?? slug;
    for (const line of section.split("\n")) {
      const d = line.match(DATE_RE);
      if (!d) continue;
      const t = line.trim();
      let label = "";
      if (t.startsWith("|")) {
        const cells = t.replace(/^\|/, "").replace(/\|$/, "").split("|");
        if (cells.every((c) => /^\s*:?-{2,}:?\s*$/.test(c))) continue;
        label = cells
          .map((c) => c.trim())
          .filter((c) => c && !DATE_RE.test(c))
          .slice(0, 2)
          .join(" · ");
      } else {
        label = t.replace(/^[-*]\s*(\[[ xX]\]\s*)?/, "");
      }
      if (!label) continue;
      out.push({
        date: d[0],
        label,
        company: name,
        slug,
        source: `pipeline/companies/${slug}.md`,
      });
    }
  }

  // 2) tracker「下一步」里的 ⏰MM-DD 前缀
  for (const r of tracker) {
    const m = r.next.match(/⏰\s*(\d{1,2})[-/](\d{1,2})/);
    if (!m) continue;
    out.push({
      date: `2026-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`,
      label: r.next.replace(/⏰\s*\d{1,2}[-/]\d{1,2}\s*/, ""),
      company: r.name,
      slug: r.slug,
      source: "pipeline/tracker.md",
    });
  }

  // 3) offers.md 表格里带日期的行（offer 截止等）
  const offers = readDoc("negotiation/offers.md");
  if (offers) {
    for (const t of parseTables(offers)) {
      for (const row of t.slice(1)) {
        const joined = row.join(" ");
        const d = joined.match(DATE_RE);
        if (!d) continue;
        out.push({
          date: d[0],
          label: `offer：${row[0]}`,
          company: row[0],
          slug: null,
          source: "negotiation/offers.md",
        });
      }
    }
  }

  return out.sort((a, b) => a.date.localeCompare(b.date));
}

/* ---------- 渠道邮件模板（pipeline/referral-outreach-templates.md「C.」段） ---------- */

export interface OutreachTemplate {
  key: string; // 渠道名 = referrals.md 主表第一列
  to: string;
  subject: string;
  note: string;
  body: string; // 含 {{jobs}}/{{job_ids}}/{{job_title}}/{{job_location}} 占位符
}

export function getOutreachTemplates(): OutreachTemplate[] {
  const md = readDoc("pipeline/referral-outreach-templates.md");
  if (!md) return [];
  const out: OutreachTemplate[] = [];
  let cur: OutreachTemplate | null = null;
  let inFence = false;
  let bodyDone = false; // 每个模板只取第一个代码块
  for (const line of md.split("\n")) {
    if (cur && inFence) {
      if (/^```/.test(line)) {
        inFence = false;
        bodyDone = true;
        cur.body = cur.body.replace(/\n$/, "");
      } else {
        cur.body += line + "\n";
      }
      continue;
    }
    const h = line.match(/^### 邮件模板：(.+)$/);
    if (h) {
      if (cur) out.push(cur);
      cur = { key: h[1].trim(), to: "", subject: "", note: "", body: "" };
      bodyDone = false;
      continue;
    }
    if (!cur) continue;
    if (/^```/.test(line)) {
      if (!bodyDone) inFence = true;
      continue;
    }
    const kv = line.match(/^- (to|subject|note):\s*(.*)$/);
    if (kv) cur[kv[1] as "to" | "subject" | "note"] = kv[2].trim();
  }
  if (cur) out.push(cur);
  return out;
}

/* ---------- 状态着色辅助 ---------- */

export function pillClass(text: string): string {
  if (text.includes("🔴")) return "pill red";
  if (text.includes("👑")) return "pill gold";
  if (text.includes("✅") || text.includes("🟢")) return "pill green";
  if (text.includes("🟡") || text.includes("⚠️")) return "pill amber";
  return "pill gray";
}
