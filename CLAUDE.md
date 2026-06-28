# CLAUDE.md — OfferOS 协作约定

> 给**任何 Claude session** 看的工作契约 + 项目长期记忆。这是一个「你 + Claude」协作管理整场求职的系统（计划 / 准备 / 投递 / 内推 / 面试 / 谈判 / 复盘）。
> 新用户：部署后用站内 **/onboard 向导**（或把仓库交给 Claude/Codex 按 [SETUP.md](SETUP.md)）把它变成你自己的；人读版见 [GETTING-STARTED.md](GETTING-STARTED.md)（站内 /start）。

## 项目一句话

端到端管理你这次找工作，并让 Claude 在每一步协助。你的「北极星」见 [profile/target.md](profile/target.md)；站点身份/角色由 [`data/profile.json`](data/profile.json) 决定（`getSiteConfig()` 合并 [`src/site.config.ts`](src/site.config.ts) 默认；角色枚举见 [`src/config/roles.ts`](src/config/roles.ts)）。备战内容按 **`prep/<role>/`** 组织（DS/DE/SWE/PM/ML）。

## 开发铁律：去标识化（必守）

这个仓库是要分享出去的**模板**——**不得包含任何他人个人信息**（姓名、雇主、私人邮箱、他人真实公司进度等）。
- 展示身份一律走 `getSiteConfig()` / `data/profile.json`，**绝不写死**在组件里（`Greeting` 那次硬编码名字就是教训）。
- 样例只用虚构占位（Alex Rivera；Northwind / Vertex Cloud / Helios Media；`@example.com`）。
- 提交前 **`npm run check` 必过**（已接进 `npm run build`）：扫源作者标识 + 模板态占位完整性 + **模板题库不点名公司**。详见 [STYLEGUIDE.md](STYLEGUIDE.md)「开发铁律」。
- **题库去痕（去标识化铁律的一部分，仅针对公开模板）**：**只有在维护公开 OfferOS 模板时**才做这件事——进题库（`prep/<role>/question-bank.md`、`mock-interview-bank.md`）的题（含从网上面经新增的）先「洗」：①**改写题干，不用逐字原题**；②抹掉公司 / 产品 / 内部代号；③**不点名、不打公司标签**（公开题源如 LeetCode 题号可照引）。`npm run check` 在**模板态（`configured:false`）**强制这条。**用户 fork 配置后（`configured:true`）= 私人仓库，题库随你——原题、公司名、公司标签都行，`check` 自动放行、不需要去痕。** 换句话说：去痕是「我们对外发布模板」的责任，不是套在每个下游用户身上的负担。

## 文件分工（避免重复写）

| 文件 | 角色 | 面向 |
|---|---|---|
| **HANDOFF.md** | **唯一的「进行中」快照**：现在到哪、下个 session 先做啥、待你决定项。短(<200 行)、前瞻。**每个 session 开头先读它。** | Claude |
| **CLAUDE.md**（本文件） | 工作流约定 + 长期记忆 | Claude |
| [log/journal.md](log/journal.md) | 历史流水（发生过什么），倒序追加，回顾用 | 人/Claude |
| [README.md](README.md) | 项目介绍 + 目录导航 | 人 |
| [STYLEGUIDE.md](STYLEGUIDE.md) | 网站技术与数据格式契约（改 markdown/网站时遵守） | Claude |
| [SETUP.md](SETUP.md) · [AGENTS.md](AGENTS.md) | 交给 Claude/Codex 的部署 + onboarding 引导脚本（未配置仓库的 SessionStart 钩子会指向它） | Claude/Codex |

## Session 开场仪式（每次第一件事）

1. 读 **CLAUDE.md + HANDOFF.md**，复述你看到的现状。
2. 若在能联网的云端会话：`git pull`，报当前 HEAD 与 HANDOFF 最后状态。
3. 报告当前**模型**。
4. **扫 [inbox/](inbox/)**：有 `status: new` 的捕获（面经/JD/截图）或**网页派活 `type: request`** 就逐个处理（按 [inbox/README.md](inbox/README.md) 的 SOP），处理完移 `inbox/archive/` 或标 `status: done`，journal 记一条。
5. **扫 deadline**：聚合各公司「关键日期」表 + tracker「下一步」`⏰MM-DD` 项（= 站点 /agenda 数据源），**逾期或 3 天内到期的写进 HANDOFF 顶部提醒**；有明天的面试就生成/更新 `prep/briefs/` 速备包。
6. **收到 prep guide / 面经**（用户上传 PDF、截图或贴文）：出 `prep/briefs/` 速备包，并从中**出练习题进当前角色的 `prep/<role>/question-bank.md`**（守格式契约，喂 /practice 练习台）。

## Session 收尾仪式（宣告「完成」前必做）

1. **更新 HANDOFF.md**：本次做了啥 / 下次先做啥 / 坑 / 待用户决定项。保持 **<200 行**，超了把最老的块剪到 `handoff-archive/YYYY-MM.md`。
2. 有重要进展时，在 [log/journal.md](log/journal.md) 顶部加一条历史记录。
3. `git add -A && git commit && git push`，然后才说「完成」。

> **Git 工作流**：这是个人项目——改完**直接 commit 并推送 `main`**（不用 feature 分支、不开 PR）。push `main` → 若已连 Vercel 会自动重建上线。

## 版本号 / CHANGELOG（用户 2026-06-28 定）

- OfferOS 是公开模板，**页脚显示版本号**（点开 = `/docs/CHANGELOG`）。**每累积约 10 条更新（≈10 个 commit）就 bump 一次 minor（+0.1，如 0.2 → 0.3）**：在 [CHANGELOG.md](CHANGELOG.md) 顶部新开一节归纳这批更新、`package.json`（+ `package-lock.json`）的 `version` 同步改（`npm version <x.y.z> --no-git-tag-version`）。
- 判断是否到点：`git log --oneline <上次版本 commit>..HEAD | wc -l` 数 commit 数；到约 10 就切版本、落当天日期。不到 10 就继续攒。
- 这是 **OfferOS 专属**约定（私有 jobhunt 仓不需要）。

## 提交身份

- **云端 Claude session**：用环境默认的 git 身份（通常平台签名，GitHub 显示 Verified）——一般别改。
- **你本地手工提交**：用你自己的个人 GitHub 身份。
- **都不要用**公司/工作邮箱账号提交。

## 环境备忘

- 本地 WebFetch/WebSearch 外网可能是关的 → 抓网页（LinkedIn 职位页、面经、levels.fyi）建议在**能联网的云端会话**做；git 到 github.com 一般是通的。
- 连云端会话：在 claude.ai/code 把本仓库接上，即可在联网环境直接操作 repo（手机/网页也行）。
- 网站抓取/工具的可复用 recipe 见 [tools/](tools/)；**联网情报**：云端会话先 `bash tools/agent-reach/setup.sh` 装上互联网能力，实测通路（LinkedIn 职位 / Workday·Greenhouse·Ashby ATS API / Exa 全网语义搜索 / 视频字幕）见 [tools/web-reach.md](tools/web-reach.md)。

## 网页指挥台

- 仓库根 = **Next.js 站点**（连 Vercel 后 push `main` 自动重建），把全仓 markdown 渲染成仪表盘：今日 / 公司 / 备战 / Offers / 时间线 / 文档。规范见 [STYLEGUIDE.md](STYLEGUIDE.md)。
- **改 tracker / 公司文件「当前 opening」/ referrals 等核心表时，维持 STYLEGUIDE 的「数据格式契约」**，解析器才稳。改网站代码（`src/`）后先 `npm run build` 自检再 push。
