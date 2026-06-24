const start = {
  // 页头
  title: "🚀 新手上路 · Getting Started",
  sub: "把这个指挥台从 0 变成「你的」求职作战室，以及之后每天怎么和 Claude 协作。",

  // 「这是什么」卡片
  whatTitle: "这是什么",
  whatItem1Pre: "一个 ",
  whatItem1Bold: "「你 + Claude」协作的求职管理系统",
  whatItem1Post: "：计划 / 准备 / 投递 / 内推 / 面试 / 谈判 / 复盘，每一步 Claude 都帮你。",
  whatItem2Pre: "仓库里的 ",
  whatItem2Bold: "markdown 文件就是数据库",
  whatItem2Post: "；这个网站是只读看板 + 轻量交互，真正干活在 Claude Code 的对话里。",
  whatItem3Pre: "三个记忆文件让任何新会话都能接上：",
  whatItem3Mid1: "（长期约定）· ",
  whatItem3Mid2: "（进行中快照）· ",
  whatItem3Post: "（历史流水）。",

  // 「从 0 开始」分节
  fromZeroTitle: "从 0 开始（5 步）",
  steps: [
    {
      t: "拿到代码",
      d: "在 GitHub 点「Use this template」或 Fork，生成你自己的私有仓库。",
    },
    {
      t: "部署到 Vercel",
      d: "把仓库连到 Vercel——之后每次 push 到 main 都会自动重建上线。markdown 就是数据库，没有别的后端。",
    },
    {
      t: "加把锁",
      d: "在 Vercel 配环境变量 SITE_PASSWORD（或开 Vercel Authentication），否则你的求职数据是公开可见的。",
    },
    {
      t: "配成你的身份",
      d: "改 src/site.config.ts：名字、头像缩写、北极星、你的 owner/repo。想在网站上直接编辑/派活，再到 ⚙️ 设置里填一个 fine-grained PAT（只给这个仓库 Contents 读写，存在浏览器本地、不入库）。",
    },
    {
      t: "填上你自己",
      d: "把 profile/、pipeline/、strategy/ 里的虚构样例换成你的真实情况——可以直接让 Claude 帮你写。",
    },
  ],

  // 「the loop」卡片
  loopTitle: "之后每天怎么交互（the loop）",
  loop: [
    { k: "开场", v: "对 Claude 说「读 CLAUDE.md 和 HANDOFF.md，复述现状」——它立刻知道你进行到哪。" },
    { k: "推进", v: "直接说要做啥：出 SQL / 统计 / 产品 sense 题、按公司 tailor 简历、扫岗、起草内推邮件、整理面经、复盘面试。" },
    { k: "看板", v: "在网站上勾任务、改公司状态、内推一键推进、📨 派活（写进 inbox/，下个 session 自动处理）。" },
    { k: "收尾", v: "让 Claude 更新 HANDOFF.md + 记一条 journal + commit & push。Vercel 自动重建，网站即刻同步。" },
    { k: "随时随地", v: "在 claude.ai/code 接上这个仓库，手机/网页也能指挥，无需本地环境。" },
  ],

  // 「把样例换成你自己的」卡片
  replaceTitle: "把样例换成你自己的",
  colFile: "文件",
  colWhat: "是什么",
  replaceWhy: [
    "你的背景与成就（简历和行为面故事的底料）",
    "你的北极星与硬约束（投哪、接哪个 offer 都对照它）",
    "master 简历——构建时自动导出 docx / HTML / PDF",
    "你的目标公司与各家进度",
    "你的内推渠道",
    "题库与笔记——现在是空模板，让 Claude 按你的目标公司生成",
  ],

  // 页脚说明
  footerPre: "当前仓库里的人物 ",
  footerMid: " 和示例公司（Northwind / Vertex Cloud / Helios Media）都是",
  footerBold: "虚构占位",
  footerPost: "，放心删改。更详细的说明见 ",
  footerLink2Pre: " 与 ",
  footerLink2Post: "。",
};

export default start;
