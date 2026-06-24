import type { Metadata } from "next";
import Link from "next/link";
import { readDoc, parseTables, extractSection } from "@/lib/data";
import { getDict } from "@/i18n/server";

export const metadata: Metadata = { title: "Comp" };

/* ---------- 解析小工具 ---------- */

/** "$235k" / "235,000" / "$1.2m" → 数值（取整）。解析不到 → 0。 */
function moneyNum(s: string): number {
  const m = String(s ?? "").replace(/[,\s]/g, "").match(/([\d.]+)\s*([kKmM]?)/);
  if (!m) return 0;
  let n = parseFloat(m[1]);
  const u = m[2].toLowerCase();
  if (u === "k") n *= 1e3;
  else if (u === "m") n *= 1e6;
  return Math.round(n);
}

/** 数值 → "$235k" / "$1.2M"。0 → "—"。 */
function fmtMoney(n: number): string {
  if (!n) return "—";
  return n >= 1e6 ? `$${(n / 1e6).toFixed(1).replace(/\.0$/, "")}M` : `$${Math.round(n / 1e3)}k`;
}

/** 取某 `## 标题` 下第一张表的数据行（已去表头）。 */
function rowsOf(md: string, heading: string): string[][] {
  const sec = extractSection(md, heading);
  if (!sec) return [];
  const t = parseTables(sec)[0];
  return t ? t.slice(1) : [];
}

const SEG = [
  { key: "base", color: "var(--sage)" },
  { key: "stock", color: "var(--coral)" },
  { key: "bonus", color: "var(--amber)" },
] as const;

type Row = { base: number; stock: number; bonus: number };
const total = (r: Row) => r.base + r.stock + r.bonus;

/** levels.fyi 风格的总包堆叠条：外宽 = total/max，内段 = base/stock/bonus 占比。 */
function CompBar({ r, max }: { r: Row; max: number }) {
  const t = total(r);
  const w = max > 0 ? Math.max(8, (t / max) * 100) : 0;
  return (
    <div
      aria-hidden
      style={{
        display: "flex",
        height: 13,
        width: `${w}%`,
        borderRadius: 7,
        overflow: "hidden",
        background: "var(--line)",
        boxShadow: "inset 0 0 0 1px var(--line-soft)",
      }}
    >
      {SEG.map((s) => {
        const v = r[s.key];
        return v > 0 ? <span key={s.key} style={{ flexGrow: v, background: s.color }} /> : null;
      })}
    </div>
  );
}

function Dot({ color }: { color: string }) {
  return (
    <span
      style={{ width: 10, height: 10, borderRadius: 3, background: color, display: "inline-block", marginRight: 6, verticalAlign: "middle" }}
    />
  );
}

const mono = { fontFamily: "var(--mono)" } as const;

/* ---------- 页面 ---------- */

export default async function CompPage() {
  const d = await getDict();
  const c = d.comp;
  const md = readDoc("negotiation/comp-research.md") ?? "";

  const levels = rowsOf(md, "目标级别市场区间")
    .map((r) => ({ label: (r[0] ?? "").trim(), base: moneyNum(r[1]), stock: moneyNum(r[2]), bonus: moneyNum(r[3]), range: (r[5] ?? "").trim() }))
    .filter((x) => total(x) > 0);

  const companies = rowsOf(md, "各公司样本")
    .map((r) => ({ company: (r[0] ?? "").trim(), level: (r[1] ?? "").trim(), base: moneyNum(r[2]), stock: moneyNum(r[3]), bonus: moneyNum(r[4]), source: (r[6] ?? "").trim() }))
    .filter((x) => total(x) > 0)
    .sort((a, b) => total(b) - total(a));

  const expect = rowsOf(md, "我的期望区间").map((r) => ({ k: (r[0] ?? "").trim(), v: (r[1] ?? "").trim(), note: (r[2] ?? "").trim() }));

  const hasData = levels.length > 0 || companies.length > 0;
  const maxLevel = Math.max(1, ...levels.map(total));
  const maxCompany = Math.max(1, ...companies.map(total));

  const legend = (
    <div className="muted small" style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 2 }}>
      <span><Dot color="var(--sage)" />{c.legendBase}</span>
      <span><Dot color="var(--coral)" />{c.legendStock}</span>
      <span><Dot color="var(--amber)" />{c.legendBonus}</span>
    </div>
  );

  return (
    <>
      <h1 className="page-title">{c.title}</h1>
      <p className="page-sub">{c.sub}</p>

      {!hasData ? (
        <div className="card section">
          <div className="card-title">{c.emptyTitle}</div>
          <p className="muted small" style={{ marginTop: 6 }}>{c.emptyHint}</p>
          <div className="actions" style={{ marginTop: 12 }}>
            <Link className="btn-primary" href="/docs/negotiation/comp-research">{c.emptyCta}</Link>
          </div>
        </div>
      ) : (
        <>
          <p className="muted small" style={{ marginTop: -6, marginBottom: 18 }}>💡 {c.sampleNote}</p>

          {/* 市场区间（按级别） */}
          {levels.length > 0 && (
            <section className="card section">
              <div className="tile-head" style={{ display: "block" }}>
                <span className="tile-title">{c.marketTitle}</span>
                <div className="muted small" style={{ marginTop: 2 }}>{c.marketSub}</div>
                {legend}
              </div>
              <div style={{ display: "grid", gap: 18, marginTop: 16 }}>
                {levels.map((l) => (
                  <div key={l.label}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 7 }}>
                      <span style={{ fontWeight: 650 }}>{l.label}</span>
                      <span style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                        <b style={{ ...mono, fontSize: "var(--t-lg)" }}>{fmtMoney(total(l))}</b>
                        {l.range && <span className="muted small" style={mono}>{c.rangeLabel} {l.range}</span>}
                      </span>
                    </div>
                    <CompBar r={l} max={maxLevel} />
                    <div className="muted small" style={{ ...mono, marginTop: 6 }}>
                      Base {fmtMoney(l.base)} · Stock {fmtMoney(l.stock)} · Bonus {fmtMoney(l.bonus)}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 各公司样本 */}
          {companies.length > 0 && (
            <section className="card section">
              <div className="tile-head" style={{ display: "block" }}>
                <span className="tile-title">{c.companyTitle}</span>
                <div className="muted small" style={{ marginTop: 2 }}>{c.companySub}</div>
              </div>
              <div style={{ display: "grid", gap: 16, marginTop: 16 }}>
                {companies.map((co) => (
                  <div key={co.company}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 7 }}>
                      <span>
                        <b style={{ fontWeight: 650 }}>{co.company}</b>
                        {co.level && <span className="muted small" style={{ marginLeft: 8 }}>{co.level}</span>}
                      </span>
                      <b style={{ ...mono, fontSize: "var(--t-md)" }}>{fmtMoney(total(co))}</b>
                    </div>
                    <CompBar r={co} max={maxCompany} />
                    {co.source && <div className="muted small" style={{ marginTop: 6 }}>{c.source}{co.source}</div>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 期望区间 */}
          {expect.length > 0 && (
            <section className="card section">
              <div className="tile-head" style={{ display: "block" }}>
                <span className="tile-title">{c.expectTitle}</span>
              </div>
              <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                {expect.map((e) => (
                  <div key={e.k} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap", borderBottom: "1px solid var(--line-soft)", paddingBottom: 8 }}>
                    <span style={{ fontWeight: 600 }}>{e.k}</span>
                    <span style={{ display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap", justifyContent: "flex-end" }}>
                      <b style={mono}>{e.v}</b>
                      {e.note && <span className="muted small">{e.note}</span>}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <div className="actions section">
        <Link className="btn-ghost" href="/docs/negotiation/comp-research">{c.fullDoc}</Link>
        <Link className="btn-ghost" href="/offers">{c.toOffers}</Link>
      </div>
    </>
  );
}
