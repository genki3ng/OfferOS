# 流水日志（Journal）

> 每周/每次重要进展记一行，**倒序**（最新在上）。每场面试后顺手记。

## 2026-06-28 — 练习台内联显示 Claude 点评（同步自上游）

- 痛点：交批改后点评写进 `prep/<role>/practice-log.md` 的「备注」列，但练习台 UI 只用了自评 emoji + 次数、把 `note` 丢了——点评只能去 `/docs/.../practice-log` 翻整张表，不挂在题上。
- 修：`practice/page.tsx` 把备注非空的行渲染成 markdown 收进 `QStat.notes`（最新在前）；`PracticeApp.tsx` 题目卡问题文下方加可折叠「📝 Claude 点评」框（默认收起免剧透）+ 题表项加 📝 徽章；新增 `.review-box` 样式 + i18n zh/en `reviewHeading/reviewBadge`。`npm run build`（含去标识化 `check`）通过。

## 2026-06-28 — 今日卡 / 时间线显示面试「具体时间」（同步自上游）

- 之前今日 hero 与 /timeline 只显示面试**日期**、没显示几点——时间和日期挤在公司「关键日期」表同一单元，`getAgenda` 过滤带日期单元时把时间一起丢了。
- `AgendaItem` 加 `time` 字段 + `extractTime()`（正则抽 `HH:MM`〔可区间〕+ 可选 AM/PM + 可选时区），三处来源都填；今日 hero 日期 pill 里**高亮**时间（`.when-time`）、on-deck 也带时间；`/timeline` AgendaList 行尾 `.agenda-time`。`npm run build`（含去标识化 `check`）通过。

## 2026-06-27 — 练习台：编程题加「自由 coding 框 + 要点对照」

- 编程题（SQL / Python / Coding / 算法，靠 `isCoding(category)` 判定）在「显示要点」前先给一个等宽暗色 coding 框手写解法（模拟实战）；揭晓后**上下排布：你的解法在上 / 参考要点在下**对照差异（桌面/手机都单列、coding 框满宽），附「差异就是下次的提分点」提示 + 一键把解法交 Claude 批改。
- 作答按题存 `localStorage(jh_practice_attempts)`、刷新/切题/无 token 都不丢；非编程题（统计/产品 Sense/行为面）保留原「出声讲 → 看要点」流程。
- 改 `src/app/practice/PracticeApp.tsx` + `globals.css`（`.code-box` / `.compare`）+ i18n zh/en practice 字典；README 练习台描述同步。`npm run build`（含去标识化 `check`）通过、Playwright 截图人审（DS·SQL 对照态、无 page error）。
- **跟进**：① 对照视图改**上下排布**（桌面也单列，coding 框拿满宽度）；② **code 框 Tab 缩进修复**——之前按 Tab 会把焦点跳出去，加 `onCodeKeyDown`：Tab 进 2 空格 / Shift+Tab 退 / 多行选区整体缩进、焦点留在框内。
- **题库质量准则（同步自上游）**：STYLEGUIDE 题库格式契约加一条——**每题题目行/题干必须有「具体可作答的一问」**，别只写题型/话题标签把任务藏进「要点」；面经没留逐字原题就据描述 + 标准 schema 复原并注明。扫了模板 5 角色共 149 题，无此类「光标题没题面」缺陷。

## 2026-06-27 — 题库去痕铁律（面试 NDA + 开源）

- 立铁律：进题库（question-bank / mock-interview-bank）的题一律先「洗」——非逐字原题、抹掉公司/产品/内部代号、**模板不打公司标签**（假设来源未知）；公开题源如 LeetCode 题号可照引。写进 CLAUDE.md / STYLEGUIDE.md / AGENTS.md / SETUP.md / inbox SOP。
- 巡检：`check-no-personal-info.mjs` 新增「模板态题库题目行不点名公司」硬拦（只扫 `## ` / `### [id]` / 编号题，跳过 `- 要点` 正文里的工具名如 Snowflake / Google S2；env `DEID_ALLOW_BANK_COMPANIES=1` 可临时放行）。
- 洗稿：DS 题库 ps-01/02/04/07/08 + mock bank 里点名 DoorDash/Uber/Instagram/YouTube/Airbnb/DashPass 的题改成中性占位（短视频产品 / 外卖平台 / 网约车 / 双边市场）。其余角色题库本就干净。
- 决策（用户拍板）：**保留**练习台「来源/标签」过滤给下游 fork 用（用户在私库按公司给自己的题打标签、自担 NDA 风险），但**模板出厂零公司标签**。
- 范围澄清（用户）：**去痕只绑定公开 OfferOS 模板**（`configured:false`，`npm run check` 强制）。用户 fork 配置后 = 私人仓库，题库随意（原题 / 公司名 / 公司标签都行），**不强加去痕**。把上一版误塞进开场仪式 step 6 / inbox SOP 的去痕动作回退了；去痕只留在「开发铁律」并标注**仅针对公开模板**。
- 可选后续：若想让 fork 用户「显式」打标签（不必把公司名写进标题），可加 inline/frontmatter tag 支持。
- 验证：`npm run check` + `npm run build` 均过。

## 2026-01-15 — 启动 / kickoff（示例）

- 搭好仓库与网站指挥台（push `main` 自动重建部署）。
- 填了目标公司初稿（Northwind / Vertex Cloud / Helios Media）。
- 起草简历 master，规划第一周 outreach 与投递节奏。

---

<!-- 新条目加在这行上方：## YYYY-MM-DD — 标题 -->
