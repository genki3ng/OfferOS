import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/site.config";
import { getDict } from "@/i18n/server";

export const metadata: Metadata = { title: "新手上路 · Getting Started" };

const STEP_META = [{ n: 1 }, { n: 2 }, { n: 3 }, { n: 4 }, { n: 5 }];

const REPLACE_META = [
  { f: "profile/candidate-profile.md", href: "/docs/profile/candidate-profile" },
  { f: "profile/target.md", href: "/docs/profile/target" },
  { f: "profile/resume/master.md", href: "/docs/profile/resume/master" },
  { f: "data/tracker.json + pipeline/companies/*.md", href: "/pipeline" },
  { f: "pipeline/referrals.md", href: "/referrals" },
  { f: "prep/*", href: "/prep" },
];

export default async function StartPage() {
  const d = await getDict();
  const steps = STEP_META.map((m, i) => ({ ...m, ...d.start.steps[i] }));
  const loop = d.start.loop;
  const replace = REPLACE_META.map((m, i) => ({ ...m, why: d.start.replaceWhy[i] }));
  return (
    <>
      <h1 className="page-title">{d.start.title}</h1>
      <p className="page-sub">
        {d.start.sub}
      </p>

      <div className="card section">
        <div className="card-title">{d.start.whatTitle}</div>
        <ul>
          <li>{d.start.whatItem1Pre}<b>{d.start.whatItem1Bold}</b>{d.start.whatItem1Post}</li>
          <li>{d.start.whatItem2Pre}<b>{d.start.whatItem2Bold}</b>{d.start.whatItem2Post}</li>
          <li>{d.start.whatItem3Pre}<code>CLAUDE.md</code>{d.start.whatItem3Mid1}<code>HANDOFF.md</code>{d.start.whatItem3Mid2}<code>log/journal.md</code>{d.start.whatItem3Post}</li>
        </ul>
      </div>

      <h2 className="page-title" style={{ fontSize: "1.15rem", marginTop: 28 }}>{d.start.fromZeroTitle}</h2>
      <div className="grid grid-2 section">
        {steps.map((s) => (
          <section className="tile" key={s.n}>
            <div className="tile-head">
              <span className="tile-title">
                <span className="ic" style={{ fontWeight: 700 }}>{s.n}</span>
                {s.t}
              </span>
            </div>
            <p className="muted" style={{ margin: 0 }}>{s.d}</p>
          </section>
        ))}
      </div>

      <div className="card section">
        <div className="card-title">{d.start.loopTitle}</div>
        <ul className="checklist">
          {loop.map((l) => (
            <li key={l.k} style={{ alignItems: "flex-start" }}>
              <span className="txt">
                <b>{l.k}</b>
                <div className="muted small" style={{ fontWeight: 400, marginTop: 2 }}>{l.v}</div>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="card section">
        <div className="card-title">{d.start.replaceTitle}</div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr><th>{d.start.colFile}</th><th>{d.start.colWhat}</th></tr>
            </thead>
            <tbody>
              {replace.map((r) => (
                <tr key={r.f}>
                  <td style={{ minWidth: 240 }}><Link href={r.href}><code>{r.f}</code></Link></td>
                  <td>{r.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="muted small section">
        {d.start.footerPre}<b>{siteConfig.ownerName}</b>{d.start.footerMid}<b>{d.start.footerBold}</b>{d.start.footerPost}
        <Link href="/docs/GETTING-STARTED">GETTING-STARTED.md</Link>{d.start.footerLink2Pre}
        <Link href="/docs/CLAUDE">CLAUDE.md</Link>{d.start.footerLink2Post}
      </p>
    </>
  );
}
