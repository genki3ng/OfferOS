# 流水日志（Journal）

> 每周/每次重要进展记一行，**倒序**（最新在上）。每场面试后顺手记。

## 2026-06-27 — 题库去痕铁律（面试 NDA + 开源）

- 立铁律：进题库（question-bank / mock-interview-bank）的题一律先「洗」——非逐字原题、抹掉公司/产品/内部代号、**模板不打公司标签**（假设来源未知）；公开题源如 LeetCode 题号可照引。写进 CLAUDE.md / STYLEGUIDE.md / AGENTS.md / SETUP.md / inbox SOP。
- 巡检：`check-no-personal-info.mjs` 新增「模板态题库题目行不点名公司」硬拦（只扫 `## ` / `### [id]` / 编号题，跳过 `- 要点` 正文里的工具名如 Snowflake / Google S2；env `DEID_ALLOW_BANK_COMPANIES=1` 可临时放行）。
- 洗稿：DS 题库 ps-01/02/04/07/08 + mock bank 里点名 DoorDash/Uber/Instagram/YouTube/Airbnb/DashPass 的题改成中性占位（短视频产品 / 外卖平台 / 网约车 / 双边市场）。其余角色题库本就干净。
- 决策（用户拍板）：**保留**练习台「来源/标签」过滤给下游 fork 用（用户在私库按公司给自己的题打标签、自担 NDA 风险），但**模板出厂零公司标签**。
- 工作流澄清（用户）：来源公司通常**已知**——用户给料时会点名是哪家（用于私人备战/速备包 OK）；去痕是 **Claude 在「私人备战 → 公开题库」边界上的主动动作**，入库前由 Claude 洗，不是"假装不知道来源"。已写进 CLAUDE.md 开发铁律 + 开场仪式 step 6。
- 可选后续：若想让 fork 用户「显式」打标签（不必把公司名写进标题），可加 inline/frontmatter tag 支持。
- 验证：`npm run check` + `npm run build` 均过。

## 2026-01-15 — 启动 / kickoff（示例）

- 搭好仓库与网站指挥台（push `main` 自动重建部署）。
- 填了目标公司初稿（Northwind / Vertex Cloud / Helios Media）。
- 起草简历 master，规划第一周 outreach 与投递节奏。

---

<!-- 新条目加在这行上方：## YYYY-MM-DD — 标题 -->
