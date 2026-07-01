/** English dictionary. Keys mirror zh.ts exactly (typed against Dict). Areas in ./en/<area>.ts. */
import type { Dict } from "./zh";
import agendaList from "./en/agendaList";
import ask from "./en/ask";
import askButton from "./en/askButton";
import coldOutreach from "./en/coldOutreach";
import company from "./en/company";
import comp from "./en/comp";
import countdown from "./en/countdown";
import dailyGuide from "./en/dailyGuide";
import docs from "./en/docs";
import docsDoc from "./en/docsDoc";
import followup from "./en/followup";
import greeting from "./en/greeting";
import intel from "./en/intel";
import jobs from "./en/jobs";
import journal from "./en/journal";
import liveInbox from "./en/liveInbox";
import livePipeline from "./en/livePipeline";
import login from "./en/login";
import offers from "./en/offers";
import pipeline from "./en/pipeline";
import pipelineJobs from "./en/pipelineJobs";
import practice from "./en/practice";
import prepPage from "./en/prepPage";
import prose from "./en/prose";
import quickPanel from "./en/quickPanel";
import referralAdvance from "./en/referralAdvance";
import referralKit from "./en/referralKit";
import referrals from "./en/referrals";
import settings from "./en/settings";
import statusCell from "./en/statusCell";
import taskList from "./en/taskList";
import theme from "./en/theme";
import timeline from "./en/timeline";
import today from "./en/today";
import todayCard from "./en/todayCard";
import onboard from "./en/onboard";
import onboardingBanner from "./en/onboardingBanner";
import start from "./en/start";

const en: Dict = {
  nav: {
    today: "Today",
    companies: "Companies",
    prep: "Prep",
    practice: "Practice",
    offers: "Offers",
    comp: "Comp",
    timeline: "Timeline",
    referrals: "Referrals",
    jobs: "Jobs",
    intel: "Intel",
    docs: "Docs",
    settings: "Settings",
    more: "More",
    primaryAria: "Primary navigation",
    moreAria: "More destinations",
    themeLabel: "Theme",
    settingsAria: "Settings",
  },
  footer: {
    source: "Data = this repo's markdown · auto-rebuilds on push to main ·",
    startGuide: "Getting started",
    github: "GitHub",
  },
  lang: {
    aria: "Switch language",
    zh: "中文",
    en: "EN",
  },
  agendaList,
  ask,
  askButton,
  coldOutreach,
  company,
  comp,
  countdown,
  dailyGuide,
  docs,
  docsDoc,
  followup,
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

export default en;
