const onboardingBanner = {
  titleUnconfigured: "🚀 开始设置",
  titleConfigured: "👋 新手上路",

  // 未配置（模板态）正文
  unconfiguredPre: "这个仓库还是",
  unconfiguredBold: "模板态",
  unconfiguredMid: "。用 ",
  unconfiguredAfterLink:
    " 向导回答几个问题（目标角色 / 级别 / 目标公司 / 名字），就会把站点个性化成你的、并选好对应角色的备战模板。也可以把仓库交给 ",
  unconfiguredCodexBold: "Claude / Codex",
  unconfiguredBeforeCode: "，按 ",
  unconfiguredAfterCode: " 引导你装依赖、部署到 Vercel、配密码与 PAT。",

  // 已配置正文
  configured:
    "这是一个「你 + Claude」协作的求职指挥台 —— 仓库里的 markdown 就是数据库，网站只是看板。改完直接 push，Vercel 自动重建上线。",

  // 按钮
  ctaUnconfigured: "开始设置 →",
  ctaConfigured: "重跑上手向导",
  dismiss: "知道了",
};

export default onboardingBanner;
