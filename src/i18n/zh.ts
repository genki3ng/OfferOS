/** 中文字典（jobhunt 默认）。键与 en.ts 一一对应；组件只引键，故两仓组件代码一致、不分叉。
 *  结构：shell（nav/footer/lang）内联；各页/组件按 area 拆到 ./zh/<area>.ts（en 同结构在 ./en/<area>.ts）。
 *  这样多 agent 可各管一个 area 文件、互不冲突；新增 area 在此 import + 并入。 */
import agendaList from "./zh/agendaList";
import ask from "./zh/ask";
import askButton from "./zh/askButton";
import coldOutreach from "./zh/coldOutreach";
import company from "./zh/company";
import countdown from "./zh/countdown";
import dailyGuide from "./zh/dailyGuide";
import docs from "./zh/docs";
import docsDoc from "./zh/docsDoc";
import greeting from "./zh/greeting";
import intel from "./zh/intel";
import jobs from "./zh/jobs";
import journal from "./zh/journal";
import liveInbox from "./zh/liveInbox";
import livePipeline from "./zh/livePipeline";
import login from "./zh/login";
import offers from "./zh/offers";
import pipeline from "./zh/pipeline";
import pipelineJobs from "./zh/pipelineJobs";
import practice from "./zh/practice";
import prepPage from "./zh/prepPage";
import prose from "./zh/prose";
import quickPanel from "./zh/quickPanel";
import referralAdvance from "./zh/referralAdvance";
import referralKit from "./zh/referralKit";
import referrals from "./zh/referrals";
import settings from "./zh/settings";
import statusCell from "./zh/statusCell";
import taskList from "./zh/taskList";
import theme from "./zh/theme";
import timeline from "./zh/timeline";
import today from "./zh/today";
import todayCard from "./zh/todayCard";
import onboard from "./zh/onboard";
import onboardingBanner from "./zh/onboardingBanner";
import start from "./zh/start";

const zh = {
  nav: {
    today: "今日",
    companies: "公司",
    prep: "备战",
    practice: "练习",
    offers: "Offers",
    timeline: "时间线",
    referrals: "内推",
    jobs: "岗位库",
    intel: "情报",
    docs: "文档",
    settings: "设置",
    more: "更多",
    primaryAria: "主导航",
    moreAria: "更多去处",
    themeLabel: "主题",
    settingsAria: "设置",
  },
  footer: {
    source: "数据源 = 本仓库 markdown · push 到 main 后自动重建 ·",
    startGuide: "上手指南",
    github: "GitHub",
  },
  lang: {
    aria: "切换语言",
    zh: "中文",
    en: "EN",
  },
  agendaList,
  ask,
  askButton,
  coldOutreach,
  company,
  countdown,
  dailyGuide,
  docs,
  docsDoc,
  greeting,
  intel,
  jobs,
  journal,
  liveInbox,
  livePipeline,
  login,
  offers,
  pipeline,
  pipelineJobs,
  practice,
  prepPage,
  prose,
  quickPanel,
  referralAdvance,
  referralKit,
  referrals,
  settings,
  statusCell,
  taskList,
  theme,
  timeline,
  today,
  todayCard,
  onboard,
  onboardingBanner,
  start,
};

export default zh;
// 不加 as const：键仍是字面量（labelKey 用），值放宽为 string（en.ts 才能赋同形）。
export type Dict = typeof zh;
