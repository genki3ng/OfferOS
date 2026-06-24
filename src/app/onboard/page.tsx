"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ROLES, ROLE_SLUGS, getRole, type RoleSlug } from "@/config/roles";
import { getToken, ghGetFile, ghPutFile, sendRequestToClaude, REPO } from "@/lib/githubClient";
import { useDict } from "@/i18n/client";

/* ---------- 类型与工具 ---------- */

type Mode = "remote" | "hybrid" | "onsite";
type Visa = "needed" | "not-needed" | "unsure";

interface Wizard {
  ownerName: string;
  ownerInitials: string;
  role: RoleSlug;
  currentLevel: string;
  targetLevel: string;
  locationMode: Mode | "";
  regions: string;
  visa: Visa | "";
  companies: string[];
  companyInput: string;
  motto: string;
  northStar: string;
}

const BLANK: Wizard = {
  ownerName: "",
  ownerInitials: "",
  role: "ds",
  currentLevel: "",
  targetLevel: "",
  locationMode: "",
  regions: "",
  visa: "",
  companies: [],
  companyInput: "",
  motto: "稳住节奏，",
  northStar: "",
};

const DRAFT_KEY = "jh_onboard_draft";
const MODE_LABEL: Record<Mode, string> = { remote: "远程 Remote", hybrid: "混合 Hybrid", onsite: "现场 Onsite" };
const VISA_LABEL: Record<Visa, string> = { needed: "需要 sponsorship", "not-needed": "不需要", unsure: "待定" };

function initialsFrom(name: string): string {
  const s = name.trim();
  if (!s) return "";
  const parts = s.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return /^[a-z]/i.test(s) ? s.slice(0, 2).toUpperCase() : s.slice(0, 1);
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9一-龥]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "company"
  );
}

function northStarPreview(w: Wizard): string {
  if (w.northStar.trim()) return w.northStar.trim();
  const lvl = w.targetLevel || w.currentLevel || "Senior→Staff";
  return getRole(w.role).northStarTemplate.replace("{level}", lvl);
}

function buildProfile(w: Wizard) {
  return {
    schemaVersion: 1,
    configured: true,
    ownerName: w.ownerName.trim() || "我",
    ownerInitials: (w.ownerInitials.trim() || initialsFrom(w.ownerName) || "我").slice(0, 3),
    motto: w.motto.trim() || "稳住节奏，",
    northStar: northStarPreview(w),
    role: w.role,
    currentLevel: w.currentLevel.trim(),
    targetLevel: w.targetLevel.trim(),
    location: { mode: w.locationMode || "remote", regions: w.regions.split(/[,，、]/).map((s) => s.trim()).filter(Boolean) },
    visaSponsorship: w.visa || "unsure",
    targetCompanies: w.companies,
    createdAt: new Date().toISOString(),
  };
}

type Profile = ReturnType<typeof buildProfile>;

function buildTrackerJson(p: Profile): string {
  const role = getRole(p.role);
  const companies = p.targetCompanies.map((name) => ({
    name,
    slug: slugify(name),
    careers: null,
    role: role.defaultRoleTitle,
    tier: 2,
    status: "researching",
    perm: "",
    referral: "待找",
    next: "核实在招岗位 + 找内推渠道",
  }));
  return JSON.stringify({ companies }, null, 2) + "\n";
}

function buildTargetMd(p: Profile): string {
  const role = getRole(p.role);
  const today = new Date().toISOString().slice(0, 10);
  const loc =
    `${MODE_LABEL[(p.location.mode as Mode) || "remote"]}` +
    (p.location.regions.length ? ` · ${p.location.regions.join("、")}` : "");
  const companies = p.targetCompanies.join("、") || "（填目标公司）";
  return `# 北极星 与 约束（Target）

> 由 /onboard 向导生成（${today}）。这是整个求职的「北极星」：任何决策都回到这里对照。改完直接 push。

## 🟢 首要动机

- ${p.northStar}

## 🎯 目标

- 角色方向：**${role.label}（${role.shortLabel}）**。
- 目标公司：**${companies}**。

## 🏆 级别

- 当前：**${p.currentLevel || "（填）"}** → 目标：**${p.targetLevel || "（填）"}**。

## 📍 地区

- ${loc}

## 🛂 签证 / Sponsorship

- ${VISA_LABEL[(p.visaSponsorship as Visa) || "unsure"]}

## 🗓️ 时间线

| 里程碑 | 日期 |
|---|---|
| 启动 | ${today} |
| 理想拿到 offer | （填，如 ~3 个月内）|
| 入职 | （填，可灵活）|

## ✅ Dealbreakers / 优先级排序

1. （最重要的硬约束，如方向 / 级别 / sponsorship）
2. 总包
3. 入职时间
4. 地区
`;
}

function handoffPrompt(p: Profile): string {
  const role = getRole(p.role);
  return `请把下面这份 onboarding profile 应用到我的 OfferOS 仓库，改完 commit 并 push 到 main：

1) 写 data/profile.json（原样照抄，configured 必须为 true）：
\`\`\`json
${JSON.stringify(p, null, 2)}
\`\`\`

2) 重写 data/tracker.json，把示例公司换成我的目标公司；每条用现有 schema：
   { "name", "slug"(name 转 kebab), "careers": null, "role": "${role.defaultRoleTitle}", "tier": 2, "status": "researching", "perm": "", "referral": "待找", "next": "核实在招岗位 + 找内推渠道" }
   我的目标公司：${p.targetCompanies.join("、") || "（无）"}

3) 重写 profile/target.md：用上面 profile 的动机 / 级别 / 地区 / 签证 / 公司填好（保留中文小标题）。

4) 生成 prep/${role.slug}/ 备战 pack：按 src/config/roles.ts 里 ${role.slug} 的 prepCategories 充实题库与各板块（守 STYLEGUIDE 的 question-bank 格式契约：## 类别 → ### [id] 题 → **要点**）。

5) 完整部署 / 配置流程见仓库根的 SETUP.md。`;
}

/* ---------- 小组件 ---------- */

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {hint && <div className="muted small" style={{ marginBottom: 6 }}>{hint}</div>}
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid var(--border, #d9d4cc)",
  background: "var(--bg, #fff)",
  color: "inherit",
  font: "inherit",
};

function Chip({ label, onClick }: { label: string; active?: boolean; onClick: () => void }) {
  return (
    <button type="button" className="btn-ghost" onClick={onClick} style={{ marginRight: 6, marginBottom: 6 }}>
      {label}
    </button>
  );
}

/* ---------- 主向导 ---------- */

export default function OnboardPage() {
  const d = useDict();
  const STEPS = d.onboard.steps;
  const MODE_DICT: Record<Mode, string> = {
    remote: d.onboard.modeRemote,
    hybrid: d.onboard.modeHybrid,
    onsite: d.onboard.modeOnsite,
  };
  const VISA_DICT: Record<Visa, string> = {
    needed: d.onboard.visaNeeded,
    "not-needed": d.onboard.visaNotNeeded,
    unsure: d.onboard.visaUnsure,
  };
  const [w, setW] = useState<Wizard>(BLANK);
  const [step, setStep] = useState(0);
  const [hasToken, setHasToken] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);

  // 草稿持久化：进出 /settings 配 token 也不丢答案
  useEffect(() => {
    setHasToken(!!getToken());
    try {
      const d = localStorage.getItem(DRAFT_KEY);
      if (d) setW({ ...BLANK, ...JSON.parse(d) });
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(w));
    } catch {}
  }, [w]);

  const up = (patch: Partial<Wizard>) => setW((prev) => ({ ...prev, ...patch }));
  const role = getRole(w.role);

  const addCompany = () => {
    const v = w.companyInput.trim().replace(/[,，、]$/, "");
    if (v && !w.companies.includes(v)) up({ companies: [...w.companies, v], companyInput: "" });
    else up({ companyInput: "" });
  };

  async function doWrite() {
    setBusy(true);
    setErr("");
    try {
      const p = buildProfile(w);
      const prof = await ghGetFile("data/profile.json");
      await ghPutFile("data/profile.json", JSON.stringify(p, null, 2) + "\n", "site: onboarding — 身份/角色 profile", prof?.sha);
      const trk = await ghGetFile("data/tracker.json");
      await ghPutFile("data/tracker.json", buildTrackerJson(p), "site: onboarding — 重置目标公司清单", trk?.sha);
      const tgt = await ghGetFile("profile/target.md");
      await ghPutFile("profile/target.md", buildTargetMd(p), "site: onboarding — 重写北极星 target.md", tgt?.sha);
      await sendRequestToClaude({
        kind: "准备材料",
        topic: `生成 ${role.label} 备战 pack`,
        context: "onboard",
        detail: `用户已通过 /onboard 完成 onboarding：角色 ${role.label}（${role.slug}），级别 ${p.currentLevel || "?"} → ${p.targetLevel || "?"}。\n\n请：\n1) 按 src/config/roles.ts 里 ${role.slug} 的 prepCategories 充实 prep/${role.slug}/ 题库与各板块（已存在则按背景精炼）。\n2) 结合 profile/target.md 与目标公司定制 question-bank / sprint-plan。\n3) 目标公司：${p.targetCompanies.join("、") || "（未填）"}。`,
      });
      localStorage.setItem("jh_onboard_done", "1");
      localStorage.setItem(
        "jh_profile_cache",
        JSON.stringify({ ownerName: p.ownerName, ownerInitials: p.ownerInitials, motto: p.motto })
      );
      localStorage.removeItem(DRAFT_KEY);
      setDone(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : d.onboard.writeFailed);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <>
        <h1 className="page-title">{d.onboard.doneTitle}</h1>
        <div className="card section">
          <p>
            {d.onboard.donePackPre}
            <b>{role.label}</b>
            {d.onboard.donePackMid}
            <b>{role.shortLabel}</b>
            {d.onboard.donePackPost}
          </p>
          <p className="muted small">
            {d.onboard.doneNote}
          </p>
          <div style={{ marginTop: 12 }}>
            <Link className="btn-primary" href="/">{d.onboard.doneBackHome}</Link>
          </div>
        </div>
      </>
    );
  }

  const last = STEPS.length - 1;

  return (
    <>
      <h1 className="page-title">{d.onboard.title}</h1>
      <p className="page-sub">
        {d.onboard.subPre}<strong>{d.onboard.subStrong}</strong>{d.onboard.subMid}
        {" "}
        {d.onboard.stepLabel(step + 1, STEPS.length, STEPS[step])}
      </p>

      <div className="card section" style={{ maxWidth: 640 }}>
        {step === 0 && (
          <>
            <Field label={d.onboard.nameLabel} hint={d.onboard.nameHint}>
              <input
                style={inputStyle}
                value={w.ownerName}
                onChange={(e) => up({ ownerName: e.target.value })}
                placeholder={d.onboard.namePlaceholder}
                autoFocus
              />
            </Field>
            <Field label={d.onboard.initialsLabel} hint={d.onboard.initialsHint}>
              <input
                style={{ ...inputStyle, maxWidth: 120 }}
                value={w.ownerInitials}
                onChange={(e) => up({ ownerInitials: e.target.value })}
                placeholder={initialsFrom(w.ownerName) || "JD"}
              />
            </Field>
          </>
        )}

        {step === 1 && (
          <Field label={d.onboard.roleLabel} hint={d.onboard.roleHint}>
            <div>
              {ROLE_SLUGS.map((s) => {
                const r = ROLES[s];
                const active = w.role === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => up({ role: s })}
                    className={active ? "btn-primary" : "btn-ghost"}
                    style={{ display: "block", width: "100%", textAlign: "left", marginBottom: 8, padding: "10px 12px" }}
                  >
                    <b>{r.label}（{r.shortLabel}）</b>
                    <div className="small" style={{ opacity: 0.85 }}>{r.blurb}</div>
                  </button>
                );
              })}
            </div>
          </Field>
        )}

        {step === 2 && (
          <>
            <Field label={d.onboard.currentLevelLabel} hint={d.onboard.currentLevelHint}>
              <div style={{ marginBottom: 6 }}>
                {role.levelPresets.map((lv) => (
                  <Chip key={lv} label={lv} onClick={() => up({ currentLevel: lv })} />
                ))}
              </div>
              <input style={inputStyle} value={w.currentLevel} onChange={(e) => up({ currentLevel: e.target.value })} placeholder={d.onboard.currentLevelPlaceholder} />
            </Field>
            <Field label={d.onboard.targetLevelLabel}>
              <div style={{ marginBottom: 6 }}>
                {role.levelPresets.map((lv) => (
                  <Chip key={lv} label={lv} onClick={() => up({ targetLevel: lv })} />
                ))}
              </div>
              <input style={inputStyle} value={w.targetLevel} onChange={(e) => up({ targetLevel: e.target.value })} placeholder={d.onboard.targetLevelPlaceholder} />
            </Field>
          </>
        )}

        {step === 3 && (
          <>
            <Field label={d.onboard.workModeLabel}>
              <div>
                {(Object.keys(MODE_DICT) as Mode[]).map((m) => (
                  <button key={m} type="button" onClick={() => up({ locationMode: m })} className={w.locationMode === m ? "btn-primary" : "btn-ghost"} style={{ marginRight: 6 }}>
                    {MODE_DICT[m]}
                  </button>
                ))}
              </div>
            </Field>
            <Field label={d.onboard.regionsLabel} hint={d.onboard.regionsHint}>
              <input style={inputStyle} value={w.regions} onChange={(e) => up({ regions: e.target.value })} placeholder={d.onboard.regionsPlaceholder} />
            </Field>
          </>
        )}

        {step === 4 && (
          <Field label={d.onboard.visaLabel}>
            <div>
              {(Object.keys(VISA_DICT) as Visa[]).map((v) => (
                <button key={v} type="button" onClick={() => up({ visa: v })} className={w.visa === v ? "btn-primary" : "btn-ghost"} style={{ marginRight: 6 }}>
                  {VISA_DICT[v]}
                </button>
              ))}
            </div>
          </Field>
        )}

        {step === 5 && (
          <Field label={d.onboard.companiesLabel} hint={d.onboard.companiesHint}>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                style={inputStyle}
                value={w.companyInput}
                onChange={(e) => up({ companyInput: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addCompany();
                  }
                }}
                placeholder={d.onboard.companiesPlaceholder}
              />
              <button type="button" className="btn-ghost" onClick={addCompany}>{d.onboard.companiesAdd}</button>
            </div>
            <div style={{ marginTop: 8 }}>
              {w.companies.map((c) => (
                <Chip key={c} label={`${c} ✕`} onClick={() => up({ companies: w.companies.filter((x) => x !== c) })} />
              ))}
            </div>
          </Field>
        )}

        {step === 6 && (
          <>
            <Field label={d.onboard.mottoLabel} hint={d.onboard.mottoHint}>
              <input style={inputStyle} value={w.motto} onChange={(e) => up({ motto: e.target.value })} placeholder={d.onboard.mottoPlaceholder} />
            </Field>
            <Field label={d.onboard.northStarLabel} hint={d.onboard.northStarHint}>
              <input style={inputStyle} value={w.northStar} onChange={(e) => up({ northStar: e.target.value })} placeholder={getRole(w.role).northStarTemplate.replace("{level}", w.targetLevel || "Senior→Staff")} />
              <div className="muted small" style={{ marginTop: 6 }}>{d.onboard.northStarPreviewPrefix}{northStarPreview(w)}</div>
            </Field>
          </>
        )}

        {step === last && (
          <>
            <div className="card-title">{d.onboard.confirmTitle}</div>
            <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, background: "var(--code-bg, #f4f1ec)", padding: 12, borderRadius: 8, overflowX: "auto" }}>
              {JSON.stringify(buildProfile(w), null, 2)}
            </pre>
            {hasToken ? (
              <>
                <p className="muted small">
                  {d.onboard.confirmHasTokenPre}<code>{REPO}</code>{d.onboard.confirmHasTokenMid1}<code>data/profile.json</code>{d.onboard.confirmHasTokenMid2}<code>data/tracker.json</code>{d.onboard.confirmHasTokenMid3}
                  <code>profile/target.md</code>{d.onboard.confirmHasTokenPost(role.shortLabel)}
                </p>
                <button className="btn-primary" disabled={busy} onClick={doWrite}>
                  {busy ? d.onboard.confirmWriting : d.onboard.confirmWrite}
                </button>
                {err && <p className="small" style={{ color: "var(--danger, #d33)" }}>✗ {err}</p>}
              </>
            ) : (
              <>
                <p className="muted small">
                  {d.onboard.confirmNoTokenPre}<Link href="/settings">/settings</Link>{d.onboard.confirmNoTokenMid}
                </p>
                <textarea readOnly style={{ ...inputStyle, height: 220, fontFamily: "monospace", fontSize: 12 }} value={handoffPrompt(buildProfile(w))} />
                <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                  <button
                    className="btn-primary"
                    onClick={() => {
                      navigator.clipboard?.writeText(handoffPrompt(buildProfile(w)));
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                  >
                    {copied ? d.onboard.confirmCopied : d.onboard.confirmCopy}
                  </button>
                  <Link className="btn-ghost" href="/settings">{d.onboard.confirmGoPat}</Link>
                </div>
              </>
            )}
          </>
        )}

        {/* 导航 */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18 }}>
          <button className="btn-ghost" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
            {d.onboard.navPrev}
          </button>
          {step < last && (
            <button className="btn-primary" disabled={step === 0 && !w.ownerName.trim()} onClick={() => setStep((s) => Math.min(last, s + 1))}>
              {d.onboard.navNext}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
