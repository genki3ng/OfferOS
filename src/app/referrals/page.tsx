import type { Metadata } from "next";
import Link from "next/link";
import {
  getReferrals,
  getTracker,
  getOpenings,
  getOutreachTemplates,
  readDoc,
} from "@/lib/data";
import { renderInline, renderMarkdown, splitLogSegments } from "@/lib/markdown";
import ReferralAdvance from "@/components/ReferralAdvance";
import ReferralKit, { type KitJob } from "@/components/ReferralKit";
import ColdOutreachKit from "@/components/ColdOutreachKit";
import ClampHtml from "@/components/ClampHtml";
import LogSteps from "@/components/LogSteps";
import { getDict } from "@/i18n/server";

export const metadata: Metadata = { title: "内推渠道" };

/** 渠道第一列 → 公司基名（"TikTok/字节"→TikTok、"eBay ①"→eBay、"DoorDash ②"→DoorDash） */
const baseName = (cell: string) =>
  cell.replace(/[*_`①②③]/g, "").split(/[/／（(]/)[0].trim();

export default async function ReferralsPage() {
  const d = await getDict();
  const { header, rows } = getReferrals();
  const tracker = getTracker();
  const md = readDoc("pipeline/referrals.md") ?? "";
  const openings = getOpenings();
  const templates = getOutreachTemplates();

  const templateFor = (cell: string) => {
    const clean = cell.replace(/[*_`]/g, "").trim();
    return (
      templates.find((t) => t.key === clean) ??
      templates.find((t) => baseName(t.key) === baseName(clean)) ??
      null
    );
  };
  const jobsFor = (cell: string): KitJob[] =>
    openings
      .filter(
        (o) => !o.excluded && o.company.toLowerCase() === baseName(cell).toLowerCase()
      )
      .map((o) => {
        const urls = o.raw.match(/https?:\/\/[^)\s]+/g) ?? [];
        const link = urls.length ? urls[urls.length - 1] : "";
        const id =
          o.raw.match(/\bR\d{5,}\b/)?.[0] ??
          link.match(/\/(\d{5,})(?:[/?#]|$)/)?.[1] ??
          "";
        return {
          title: o.title,
          location: o.location,
          link,
          id,
          stars: o.stars,
          hot: o.hot,
          pinned: o.pinned,
        };
      });
  // 主表以外的说明性内容（状态流/规矩等）原样渲染在表下方
  const covered = new Set(
    rows.map((r) => (r[0] ?? "").replace(/[*_`]/g, "").split(/[\/／(（]/)[0].trim().toLowerCase())
  );
  const missing = tracker.filter(
    (t) => ![...covered].some((c) => c && t.name.toLowerCase().includes(c.slice(0, 4)))
  );

  return (
    <>
      <h1 className="page-title">{d.referrals.title}</h1>
      <p className="page-sub">
        {d.referrals.subSrc}<Link href="/docs/pipeline/referrals">pipeline/referrals.md</Link>
        {d.referrals.subFlow}
      </p>

      <div className="card section">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                {header.map((h, i) => (
                  <th key={i}>{h.replace(/\*\*/g, "")}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const statusCol = header.findIndex((h) => h.includes("状态"));
                return (
                  <tr key={i}>
                    {r.map((c, j) =>
                      j === statusCol ? (
                        <td key={j} data-label={(header[j] ?? "").replace(/\*\*/g, "")}>
                          <ReferralAdvance firstCell={r[0]} status={c} />
                        </td>
                      ) : j === 0 ? (
                        <td key={j} data-label={(header[j] ?? "").replace(/\*\*/g, "")} style={{ minWidth: 110, fontWeight: 650 }}>
                          {(() => {
                            // 「TikTok（recruiter inbound · 电商/Shop）」→ 主名一行 + 括注小字一行
                            const m = c.match(/^([^（(]+)[（(](.+)[）)]\s*$/);
                            return m ? (
                              <>
                                <span dangerouslySetInnerHTML={{ __html: renderInline(m[1].trim(), "pipeline") }} />
                                <small className="ref-qual" dangerouslySetInnerHTML={{ __html: renderInline(m[2].trim(), "pipeline") }} />
                              </>
                            ) : (
                              <span dangerouslySetInnerHTML={{ __html: renderInline(c, "pipeline") }} />
                            );
                          })()}
                          <ReferralKit channel={c} template={templateFor(c)} jobs={jobsFor(c)} />
                        </td>
                      ) : (
                        <td key={j} data-label={(header[j] ?? "").replace(/\*\*/g, "")}>
                          {splitLogSegments(c).length > 1 ? (
                            <LogSteps
                              items={splitLogSegments(c).map((g) => ({
                                icon: g.icon,
                                html: renderInline(g.text, "pipeline"),
                              }))}
                              max={3}
                            />
                          ) : (
                            // 长文格给保底列宽（cell-wide），短格（处理速度等）不占
                            <ClampHtml
                              className={Array.from(c.replace(/[*`~]/g, "")).length > 16 ? "cell-wide" : ""}
                              html={renderInline(c, "pipeline")}
                              lines={3}
                            />
                          )}
                        </td>
                      )
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {missing.length > 0 && (
        <div className="card section">
          <div className="card-title">
            {d.referrals.missingTitle(missing.length)}
            <span className="more muted">{d.referrals.missingHint}</span>
          </div>
          <ul className="next-list">
            {missing.map((t) => (
              <li key={t.name}>
                <span className="who">
                  {t.slug ? <Link href={`/companies/${t.slug}`}>{t.name}</Link> : t.name}{" "}
                  <span className={`tier-badge tier-${t.tier}`}>{d.referrals.tier[t.tier]}</span>
                </span>
                <span style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <ColdOutreachKit
                    companyCell={t.company}
                    name={t.name}
                    currentReferralCell={t.referral}
                    jobs={jobsFor(t.name)}
                    templates={{
                      connect: templates.find((x) => x.key === "LinkedIn 连接请求") ?? null,
                      dm: templates.find((x) => x.key === "LinkedIn 陌生人 DM") ?? null,
                      friend: templates.find((x) => x.key === "熟人内推请求") ?? null,
                    }}
                  />
                </span>
              </li>
            ))}
          </ul>
          <p className="muted small" style={{ marginBottom: 0 }}>
            {d.referrals.templatesPre}
            <Link href="/docs/pipeline/referral-outreach-templates">referral-outreach-templates.md</Link>
          </p>
        </div>
      )}

      <div className="card">
        <div className="card-title">{d.referrals.fullTextTitle}</div>
        <article
          className="prose"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(md, "pipeline") }}
        />
      </div>
    </>
  );
}
