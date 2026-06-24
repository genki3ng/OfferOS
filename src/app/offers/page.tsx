import type { Metadata } from "next";
import Link from "next/link";
import { getTracker, readDoc, getSiteConfig } from "@/lib/data";
import { renderMarkdown } from "@/lib/markdown";
import { getDict } from "@/i18n/server";
import Prose from "@/components/Prose";

export const metadata: Metadata = { title: "Offers" };

export default async function OffersPage() {
  const tracker = getTracker();
  const hasOffer = tracker.some((r) => /offer|入职/i.test(r.status));
  const playbook = readDoc("negotiation/README.md");
  const comp = readDoc("negotiation/comp-research.md");
  const cfg = getSiteConfig();
  const d = await getDict();

  return (
    <>
      <h1 className="page-title">{d.offers.title}</h1>
      <p className="page-sub">{d.offers.sub}</p>

      <div className="grid grid-2 section">
        <section className="tile hero empty">
          <span className="hero-eyebrow">{d.offers.eyebrow}</span>
          <h2 style={{ marginTop: 14 }}>
            {hasOffer ? d.offers.heroHasOffer : d.offers.heroNoOffer}
          </h2>
          <p className="sub" style={{ display: "block" }}>
            {d.offers.heroSubPre}<b>{cfg.northStar}</b>{d.offers.heroSubPost}
          </p>
          <div className="actions">
            <Link className="btn-primary" href="/docs/negotiation/README">
              {d.offers.btnPlaybook}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
            {comp !== null && (
              <Link className="btn-ghost" href="/comp">
                {d.offers.btnComp}
              </Link>
            )}
          </div>
        </section>

        <section className="tile">
          <div className="tile-head">
            <span className="tile-title">{d.offers.checklistTitle}</span>
          </div>
          <ul className="checklist">
            {d.offers.checklist.map((c) => (
              <li key={c.t} style={{ alignItems: "flex-start" }}>
                <span className="txt" style={{ fontWeight: 600 }}>
                  {c.t}
                  <div className="muted small" style={{ fontWeight: 400, marginTop: 2 }}>{c.d}</div>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {playbook !== null && (
        <div className="card section">
          <div className="card-title">{d.offers.playbookTitle}</div>
          <Prose html={renderMarkdown(playbook, "negotiation")} />
        </div>
      )}
    </>
  );
}
