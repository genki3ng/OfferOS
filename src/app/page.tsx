import Link from "next/link";
import Countdown from "./Countdown";
import Greeting from "@/components/Greeting";
import OnboardingBanner from "@/components/OnboardingBanner";
import { getDict } from "@/i18n/server";
import {
  getTracker,
  getOpenings,
  getReferrals,
  getJds,
  getSprintProgress,
  getAgenda,
  getHandoffPending,
  getSiteConfig,
  isUnconfigured,
} from "@/lib/data";

const stripMd = (s: string) =>
  s.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[*`~]/g, "").trim();
const cleanEvt = (s: string) =>
  stripMd(s).replace(/^[\s⏰✅🗓️📅🔔➡️→]+/u, "").trim();

/** 公司在管道里的进度档位（0=观察 … 5=offer） */
function stage(status: string): number {
  const s = status.toLowerCase();
  if (/offer|入职/.test(s)) return 5;
  if (/onsite|panel|终面|onsite/.test(s)) return 4;
  if (/phone|首轮|1st|interview|面试/.test(s)) return 3;
  if (/recruiter|screen|招聘|电话/.test(s)) return 2;
  if (/applied|referral|已投|内推/.test(s)) return 1;
  return 0;
}

const GRADS = [
  "linear-gradient(150deg,#25303B,#3A4854)",
  "linear-gradient(150deg,#5E9A78,#7CB893)",
  "linear-gradient(150deg,#6A5AC2,#8678D8)",
  "linear-gradient(150deg,#C8392F,#E05044)",
  "linear-gradient(150deg,#3A6EA5,#5B8FD0)",
  "linear-gradient(150deg,#E8674C,#F08A5D)",
];
function gradFor(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return GRADS[h % GRADS.length];
}
function initials(name: string) {
  const letters = name.replace(/[^A-Za-z]/g, "");
  return (letters.slice(0, 2) || name.slice(0, 2)).replace(/^./, (c) => c.toUpperCase());
}
function dateBlock(dateStr: string, dow: string[], monthSuffix: (m: number) => string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return { dow: dow[dt.getDay()], dnum: String(d), mon: monthSuffix(m) };
}
function whenLabel(dateStr: string, dow: string[], fmt: (dow: string, m: number, d: number) => string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return fmt(dow[dt.getDay()], m, d);
}

const ICON = {
  clock: "M12 7v5l3 2",
  check: "M9 11l3 3L22 4",
  cal: "M3 9h18M8 2v4M16 2v4",
  bolt: "m13 2-1 9h7l-8 11 1-9H5z",
};

export default async function Today() {
  const d = await getDict();
  const tracker = getTracker();
  const openings = getOpenings();
  const referrals = getReferrals();
  const jds = getJds();
  const sprint = getSprintProgress();
  const agenda = getAgenda();
  const pending = getHandoffPending();

  const t = new Date();
  const todayStr = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(
    t.getDate()
  ).padStart(2, "0")}`;
  const upcoming = agenda.filter((a) => a.date >= todayStr);

  // —— 阶段 ——
  const maxStage = tracker.reduce((m, r) => Math.max(m, stage(r.status)), 0);
  const current = maxStage >= 5 ? 4 : maxStage >= 2 ? 3 : maxStage >= 1 ? 2 : 1; // 1..5

  // —— 漏斗（进入管道后走多远，累计） ——
  const ranks = tracker.map((r) => stage(r.status));
  const fc = (min: number) => ranks.filter((r) => r >= min).length;
  const funnel = [
    { l: d.today.funnelApply, v: fc(1) },
    { l: d.today.funnelRecruiterCall, v: fc(2) },
    { l: d.today.funnelFirstRound, v: fc(3) },
    { l: d.today.funnelOnsite, v: fc(4) },
    { l: d.today.funnelOffer, v: fc(5) },
  ];
  const interviewing = fc(3); // 真正进面试（首轮+），不含 recruiter screen

  // —— 真正的「事件」（面试 / 截止），过滤掉已完成的动作日志 ——
  const EVENT_RE =
    /screen|电话|面试|面谈|首轮|终面|1st\s*round|onsite|panel|interview|codepair|case|assessment|coding|hackerrank|谈判|deadline|截止|offer\b/i;
  const LOG_RE = /网申|已投|已发|已交|已提交|已联系|现刷|nudge|无音|内推已|materials?\s*sent|applied|发出|发材料/i;
  // 同一公司同一天常被多个来源各记一条（公司文件「关键日期」+ tracker「下一步」）→ 去重，保留首条（来源更干净的公司文件行）
  const seenEvt = new Set<string>();
  const events = upcoming
    .filter((a) => EVENT_RE.test(a.label) && !LOG_RE.test(a.label))
    .filter((a) => {
      const k = `${a.slug ?? a.company}|${a.date}`;
      if (seenEvt.has(k)) return false;
      seenEvt.add(k);
      return true;
    });

  // —— 唯一下一步 ——
  const next = events[0];
  const daysUntil = (s?: string) => {
    if (!s) return null;
    const [y, m, d] = s.split("-").map(Number);
    return Math.round((new Date(y, m - 1, d).getTime() - new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime()) / 86400000);
  };
  const nextInDays = daysUntil(next?.date);
  const nextCo = next ? tracker.find((r) => r.slug === next.slug) : undefined;
  const isInterview = !!next;
  const nextJd = nextCo ? jds.find((j) => j.title.toLowerCase().includes(nextCo.name.toLowerCase())) : undefined;

  // —— 紧随其后的第二场（避免只盯第一场、忘了同步准备）——
  const secondary = events[1];
  const secInDays = daysUntil(secondary?.date);
  // 两场间隔 ≤ 3 天 = 背靠背，必须同步备
  const backToBack =
    typeof nextInDays === "number" && typeof secInDays === "number" && secInDays - nextInDays <= 3;

  // —— 该你出手了 ——
  const active = tracker.filter((r) => stage(r.status) >= 1 && r.slug !== next?.slug);
  const dateForSlug = (slug: string | null) => (slug ? upcoming.find((x) => x.slug === slug)?.date ?? "" : "");
  active.sort((a, b) => {
    const da = dateForSlug(a.slug);
    const db = dateForSlug(b.slug);
    if (da && db) return da.localeCompare(db);
    if (da !== db) return da ? -1 : 1;
    return stage(b.status) - stage(a.status);
  });
  const moves = active.slice(0, 5).map((r) => {
    const nx = r.next;
    const ball = /安排中|待发|待回|availability|待提供|该你|球在你|待用户|未发/.test(nx);
    let tag = { cls: "wait", txt: d.today.tagWait };
    let label = r.status.toLowerCase().includes("referral") ? d.today.labelWaitReferral : d.today.labelWaitRecruiter;
    if (ball) {
      tag = { cls: "yours", txt: d.today.tagYours };
      label = d.today.labelYourMove;
    } else if (stage(r.status) >= 3) {
      tag = { cls: "prep", txt: d.today.tagPrep };
      label = d.today.labelFirstRound;
    } else if (stage(r.status) === 2) {
      tag = { cls: "week", txt: d.today.tagWeek };
      label = d.today.labelRecruiterCall;
    }
    const dm = nx.match(/(\d{1,2})\/(\d{1,2})/);
    if (dm) label += ` · ${dm[1]}/${dm[2]}`;
    return { r, tag, label, perm: /👑/.test(r.perm) };
  });

  // —— 本周战绩 ——
  const refSent = referrals.rows.filter((row) => /已发|已联系|已提交|已投|已推|确认/.test(row.join(" "))).length;
  const pins = openings.filter((o) => !o.excluded && o.pinned);
  const wins = [
    interviewing > 0 ? d.today.winInterviewing(interviewing) : "",
    d.today.winResumeFinal,
    refSent > 0 ? d.today.winReferralsSent(refSent) : "",
    pins.length > 0 ? d.today.winRolesPinned(pins.length) : "",
  ].filter(Boolean).slice(0, 4);

  // —— 也在今天 ——
  const waits = active.filter((r) => /applied|referral/.test(r.status.toLowerCase()));
  const todayList: { t: string; href: string; tag?: string }[] = [
    { t: d.today.todoPractice, href: "/practice", tag: d.today.todoPracticeTag },
  ];
  if (pending.open.length) todayList.push({ t: d.today.todoDecide(stripMd(pending.open[0]).slice(0, 16)), href: "/pipeline" });
  if (waits[0]) todayList.push({ t: d.today.todoFollowUp(waits[0].name), href: `/companies/${waits[0].slug}` });

  // —— 统计 ——
  const activeOpenings = openings.filter((o) => !o.excluded).length;
  const pct = sprint.total ? Math.round((sprint.done / sprint.total) * 100) : 0;
  const greetSub =
    interviewing > 0
      ? d.today.greetSubInterviewing(interviewing)
      : d.today.greetSubDefault;
  const cfg = getSiteConfig();

  return (
    <>
      <header className="head">
        <Greeting sub={greetSub} owner={cfg.ownerName} motto={cfg.motto} />
        <div className="today-pill">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="3" />
            <path d={ICON.cal} />
          </svg>
          {d.today.fullDate(t.getFullYear(), t.getMonth() + 1, t.getDate())}
        </div>
      </header>

      <OnboardingBanner unconfigured={isUnconfigured()} />

      {/* 阶段轨 */}
      <div className="rail">
        <span className="rail-label">{d.today.railLabel}</span>
        <div className="steps">
          {d.today.phases.map((p, i) => {
            const idx = i + 1;
            const cls =
              idx < current ? (idx === current - 1 ? "filled" : "done") : idx === current ? "active" : "";
            const small = cls === "done" ? d.today.stageDone : cls === "filled" ? d.today.stageFilled : cls === "active" ? d.today.stageActive : d.today.stageTodo;
            return (
              <div className={`step ${cls}`} key={p}>
                <span className="dot">
                  {cls === "done" ? (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m5 12 5 5L20 6" />
                    </svg>
                  ) : null}
                </span>
                <span className="txt">
                  <b>{p}</b>
                  <small>{small}</small>
                </span>
                {idx < d.today.phases.length && <span className="sbar" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* BENTO */}
      <div className="bento">
        {/* 唯一下一步 */}
        {next ? (
          <section className="tile hero c8">
            <div className="toprow">
              <span className="hero-eyebrow">
                <span className="pulse" />
                {nextInDays === 0 ? d.today.heroNow : nextInDays === 1 ? d.today.heroTomorrow : typeof nextInDays === "number" && nextInDays > 1 ? d.today.heroDaysOut(nextInDays) : d.today.heroNext}
              </span>
              <span className="when">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v4l3 2" />
                </svg>
                {whenLabel(next.date, d.today.dow, d.today.whenLabel)}
                {next.time ? <b className="when-time">{next.time}</b> : null}
              </span>
            </div>
            <h2>{next.company ? `${next.company} · ${cleanEvt(next.label)}` : cleanEvt(next.label)}</h2>
            <div className="sub">
              {nextCo?.role && (
                <span className="chip">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" />
                    <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  {stripMd(nextCo.role)}
                </span>
              )}
              {nextCo && /👑/.test(nextCo.perm) && (
                <span className="chip">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 7l4 4 5-7 5 7 4-4v11H3z" />
                  </svg>
                  {d.today.permDay1}
                </span>
              )}
            </div>

            {isInterview && (
              <div className="mustask">
                <span className="lbl">{d.today.mustAskLabel}</span>
                <div className="qs">
                  <span>{d.today.mustAskSubteam}</span>
                  <span>{d.today.mustAskPerm}</span>
                  <span>{d.today.mustAskLevel}</span>
                </div>
              </div>
            )}

            {secondary && (
              <Link
                className={`hero-ondeck${backToBack ? " b2b" : ""}`}
                href={secondary.slug ? `/companies/${secondary.slug}` : "/timeline"}
              >
                <div className="od-body">
                  <span className="od-tag">
                    {backToBack && <span className="pulse" />}
                    {backToBack ? d.today.onDeckB2B : d.today.onDeckNext}
                  </span>
                  <b>{secondary.company ? `${secondary.company} · ${cleanEvt(secondary.label)}` : cleanEvt(secondary.label)}</b>
                  <small>
                    {whenLabel(secondary.date, d.today.dow, d.today.whenLabel)}
                    {secondary.time ? ` · ${secondary.time}` : ""}
                    {backToBack ? ` · ${d.today.onDeckHint}` : ""}
                  </small>
                </div>
                <svg className="od-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
            )}

            <div className="actions">
              <Link className="btn-primary" href={next.slug ? `/companies/${next.slug}` : "/timeline"}>
                {isInterview ? d.today.openBrief : d.today.viewDetail}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
              <Link className="btn-ghost" href={nextJd ? `/intel` : "/pipeline"}>
                {nextJd ? d.today.viewJd : d.today.viewPipeline}
              </Link>
            </div>
          </section>
        ) : (
          <section className="tile hero c8 empty">
            <span className="hero-eyebrow">{d.today.heroEmptyEyebrow}</span>
            <h2 style={{ marginTop: 14 }}>{d.today.heroEmptyTitle}</h2>
            <div className="actions">
              <Link className="btn-primary" href="/practice">
                {d.today.goPractice}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
            </div>
          </section>
        )}

        {/* 倒计时环 */}
        <Countdown interviews={interviewing} />

        {/* 也在今天 */}
        <section className="tile c4">
          <div className="tile-head">
            <span className="tile-title">
              <span className="ic">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              </span>
              {d.today.todayTitle}
            </span>
          </div>
          <ul className="checklist">
            {todayList.map((it, i) => (
              <li key={i}>
                <span className="txt">
                  <Link href={it.href}>{it.t}</Link>
                </span>
                {it.tag && <span className="tag-mini">{it.tag}</span>}
              </li>
            ))}
          </ul>
        </section>

        {/* 本周面试与截止 */}
        <section className="tile c5">
          <div className="tile-head">
            <span className="tile-title">
              <span className="ic">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="3" />
                  <path d={ICON.cal} />
                </svg>
              </span>
              {d.today.weekEventsTitle}
            </span>
            <span className="tile-count">{d.today.itemsCount(events.length)}</span>
          </div>
          {events.length ? (
            <ul className="events">
              {events.slice(0, 4).map((ev, i) => {
                const b = dateBlock(ev.date, d.today.dow, d.today.monthSuffix);
                return (
                  <li key={i} className={i === 0 ? "soonest" : ""}>
                    <div className="date">
                      <div className="dow">{b.dow}</div>
                      <div className="dnum">{b.dnum}</div>
                      <div className="mon">{b.mon}</div>
                    </div>
                    <div className="body">
                      <div className="ttl">
                        {ev.slug ? <Link href={`/companies/${ev.slug}`}>{ev.company || ev.label}</Link> : ev.company || ev.label}
                      </div>
                      <div className="desc">{cleanEvt(ev.label)}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="muted">{d.today.weekEventsEmpty}</p>
          )}
        </section>

        {/* 该你出手了 */}
        <section className="tile c7">
          <div className="tile-head">
            <span className="tile-title">
              <span className="ic">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={ICON.bolt} />
                </svg>
              </span>
              {d.today.inProgressTitle}
            </span>
            <Link className="more" href="/pipeline">
              {d.today.allCompanies}
            </Link>
          </div>
          <ul className="moves">
            {moves.map(({ r, tag, label, perm }) => (
              <li key={r.slug || r.name}>
                <span className="logo" style={{ backgroundImage: gradFor(r.name) }}>
                  {initials(r.name)}
                </span>
                <div className="info">
                  <b>{r.slug ? <Link href={`/companies/${r.slug}`}>{r.name}</Link> : r.name}</b>
                  <span>{label}</span>
                </div>
                {perm && <span className="perm">{d.today.permDay1}</span>}
                <span className={`tag ${tag.cls}`}>
                  <span className="pip" />
                  {tag.txt}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* 本周战绩 */}
        <section className="tile wins c5">
          <span className="eyebrow">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 4h10v4a5 5 0 0 1-10 0z" />
              <path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M9 17h6M10 17v-3M14 17v-3M8 21h8" />
            </svg>
            {d.today.weekWinsTitle}
          </span>
          <ul className="win-list">
            {wins.map((w, i) => (
              <li key={i}>
                <span className="tick">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m5 12 5 5L20 6" />
                  </svg>
                </span>
                {w}
              </li>
            ))}
          </ul>
          <div className="cheer">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" />
            </svg>
            {d.today.weekCheer}
          </div>
        </section>

        {/* 管道漏斗 */}
        <section className="tile c12">
          <div className="tile-head">
            <span className="tile-title">
              <span className="ic">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 4h18l-7 8v7l-4 2v-9z" />
                </svg>
              </span>
              {d.today.funnelTitle}
            </span>
            <Link className="more" href="/pipeline">
              {d.today.enterPipeline}
            </Link>
          </div>
          <div className="funnel">
            {funnel.map((f, i) => (
              <div className={"fstep" + (f.v > 0 && i >= 2 ? " on" : "")} key={f.l}>
                <div className="fv">{f.v}</div>
                <div className="fl">{f.l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 统计条 */}
        <section className="tile c12" style={{ padding: 0, background: "transparent", border: "none", boxShadow: "none" }}>
          <div className="grid grid-stats">
            <Link href="/pipeline" className="stat row">
              <span className="si">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 21V8l6-4 6 4v13M15 21V11l6 4v6M3 21h18" />
                </svg>
              </span>
              <div>
                <div className="num">{tracker.length}</div>
                <div className="label">{d.today.statTracking}</div>
              </div>
            </Link>
            <Link href="/jobs" className="stat row">
              <span className="si amber">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" />
                  <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M2 13h20" />
                </svg>
              </span>
              <div>
                <div className="num">{activeOpenings}</div>
                <div className="label">{d.today.statOpenRoles}</div>
              </div>
            </Link>
            {pct > 0 && (
              <Link href="/prep" className="stat row">
                <span className="si sage">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 17l6-6 4 4 8-8M21 7v6h-6" />
                  </svg>
                </span>
                <div style={{ flex: 1 }}>
                  <div className="num">{pct}%</div>
                  <div className="label">{d.today.statSprint}</div>
                  <div className="bar slim" style={{ marginTop: 6 }}>
                    <i style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </Link>
            )}
            <Link href="/referrals" className="stat row">
              <span className="si plum">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="7" r="3" />
                  <path d="M2 21v-1a6 6 0 0 1 12 0v1M16 4a3 3 0 0 1 0 6M22 21v-1a6 6 0 0 0-4-5.6" />
                </svg>
              </span>
              <div>
                <div className="num">{referrals.rows.length}</div>
                <div className="label">{d.today.statReferralChannels}</div>
              </div>
            </Link>
          </div>
        </section>
      </div>

      <p className="muted small" style={{ marginTop: 18 }}>
        {d.today.northStarPrefix}{cfg.northStar}{d.today.northStarSuffix}
        <Link href="/docs/profile/target">{d.today.northStarMore}</Link>
      </p>
    </>
  );
}
