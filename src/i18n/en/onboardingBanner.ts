const onboardingBanner = {
  titleUnconfigured: "🚀 Get started",
  titleConfigured: "👋 New here",

  // Unconfigured (template state) body
  unconfiguredPre: "This repo is still in ",
  unconfiguredBold: "template state",
  unconfiguredMid: ". Use the ",
  unconfiguredAfterLink:
    " wizard to answer a few questions (target role / level / target companies / name), and it'll personalize the site for you and pick the prep template for your role. You can also hand the repo to ",
  unconfiguredCodexBold: "Claude / Codex",
  unconfiguredBeforeCode: " and follow ",
  unconfiguredAfterCode: " to install dependencies, deploy to Vercel, and set up a password and PAT.",

  // Configured body
  configured:
    "This is a \"you + Claude\" job-search command center — the markdown in the repo is the database, and the site is just a dashboard. Make your changes and push; Vercel rebuilds and deploys automatically.",

  // Buttons
  ctaUnconfigured: "Get started →",
  ctaConfigured: "Re-run the setup wizard",
  dismiss: "Got it",
};

export default onboardingBanner;
