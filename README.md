# OfferOS 🎯

> 拿 offer 的操作系统——一个 **「你 + Claude」协作**、端到端管理整场求职的系统：**计划 → 准备 → 投递 / 内推 → 面试 → 谈判 → 复盘**。

仓库里的 **markdown 文件就是数据库**；仓库根同时是一个 **Next.js 站点**，把这些 markdown 渲染成一个可交互的仪表盘。没有别的后端——push 到 `main`，（连了 Vercel 的话）自动重建上线。

> 🧪 当前仓库装的是**虚构样例**（候选人 Alex Rivera；公司 Northwind / Vertex Cloud / Helios Media），让你一眼看到它长什么样。**[GETTING-STARTED.md](GETTING-STARTED.md) 教你把它替换成自己的**（或站内 **/start** 页）。

---

## 🚀 快速开始

1. 点 GitHub **「Use this template」** 或 Fork → 生成你自己的私有仓库。
2. 连 **Vercel** 部署，配 `SITE_PASSWORD` 加锁。
3. 改 **`src/site.config.ts`** 填你的名字 / 北极星 / `owner/repo`。
4. 把 `profile/`、`data/tracker.json` 里的样例换成你自己的。
5. 在 **claude.ai/code** 接上仓库，对 Claude 说「读 CLAUDE.md 和 HANDOFF.md，开始帮我找工作」。

详细步骤 + 之后每天怎么交互 → **[GETTING-STARTED.md](GETTING-STARTED.md)**。

---

## ✨ 它能做什么

- **今日**：bento 首页——阶段轨、唯一下一步、倒计时、本周面试、该你出手了、漏斗。
- **公司 / pipeline**：目标公司库 + 各家进度，状态/内推可直接在站上改。
- **备战**：SQL/统计实验/产品 sense 笔记、可抽题口述的 /practice 练习台、行为面 STAR。
- **Offers**：offer 到来时的对比 + 谈判主场（offer 前是预案）。
- **时间线**：关键日期聚合（/agenda）+ 日志。
- **派活**：在站上 📨 给 Claude 派活 → 写进 `inbox/`，下个 session 自动处理。

Claude 在每一步帮你：打磨/按公司 tailor 简历、出题找薄弱点、设计/解读 A/B 实验、模拟产品评审、把经历整理成 STAR、整理面经反推考点、维护进度、comp 调研与谈判话术、阶段复盘。

---

## 🧭 目录导航

| 区 | 动作 | 内容 |
|---|---|---|
| [profile/](profile/) | 定位 | [候选人背景](profile/candidate-profile.md) · [北极星](profile/target.md) · [简历](profile/resume/) |
| [strategy/](strategy/) | 计划 | 总策略 · 目标公司 · 时间线 |
| [prep/](prep/) | 准备 | SQL/Python · 统计&实验 · 产品 Sense · 行为面 · [题库](prep/question-bank.md) |
| [pipeline/](pipeline/) | 记录 | [tracker（data/tracker.json）](data/tracker.json) · [各公司](pipeline/companies/) · [内推](pipeline/referrals.md) |
| [negotiation/](negotiation/) | 谈判 | playbook · offer 对比 · comp 调研 |
| [log/](log/) · [summary/](summary/) | 记录/总结 | 流水日志 · 复盘 |

> 协作约定见 [CLAUDE.md](CLAUDE.md)；网站与数据格式契约见 [STYLEGUIDE.md](STYLEGUIDE.md)。

---

## 🛠️ 技术 & 本地开发

Next.js 15（App Router）+ React 19，零数据库（markdown 即数据源）。

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # 部署前自检（Vercel 同款构建）
```

可选环境变量：`SITE_PASSWORD`（密码门）、`NEXT_PUBLIC_OWNER_NAME` / `NEXT_PUBLIC_OWNER_INITIALS` / `NEXT_PUBLIC_NORTH_STAR` / `NEXT_PUBLIC_GITHUB_REPO`（覆盖 `src/site.config.ts` 的默认值，不改代码也能个性化）。
