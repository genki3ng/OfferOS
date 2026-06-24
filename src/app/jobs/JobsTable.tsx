"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getToken, saveOpeningPin, saveOpeningAttitude } from "@/lib/githubClient";
import { useDict } from "@/i18n/client";

export interface JobItem {
  company: string;
  slug: string;
  tier: number;
  stars: number;
  hot: boolean;
  pinned: boolean;
  attitude: "" | "love" | "no";
  excluded: boolean;
  title: string;
  location: string;
  anchor: string; // 写回定位用（行内链接或标题）
  html: string; // 已渲染好的原文行
  sectionDate: string;
}

// 态度循环：未定 → 💚 心仪 → 🚫 不合适 → 未定
const NEXT_ATT: Record<string, "" | "love" | "no"> = {
  "": "love",
  love: "no",
  no: "",
};
const ATT_ICON: Record<string, string> = { "": "·", love: "💚", no: "🚫" };
const attWeight = (a: string) => (a === "love" ? 2 : a === "no" ? 0 : 1);

export default function JobsTable({ jobs }: { jobs: JobItem[] }) {
  const d = useDict();
  const [q, setQ] = useState("");
  const [tier, setTier] = useState("");
  const [company, setCompany] = useState("");
  const [sortBy, setSortBy] = useState(""); // "" 默认 / att 态度 / fit 契合 / co 公司 / new 最新
  const [showExcluded, setShowExcluded] = useState(false);
  const [hideNo, setHideNo] = useState(false);
  const [onlyPinned, setOnlyPinned] = useState(false);
  const [canWrite, setCanWrite] = useState(false);
  const [pinOverride, setPinOverride] = useState<Record<string, boolean>>({});
  const [attOverride, setAttOverride] = useState<Record<string, "" | "love" | "no">>({});
  const [busyKey, setBusyKey] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setCanWrite(!!getToken());
    if (new URLSearchParams(location.search).has("pinned")) setOnlyPinned(true);
  }, []);

  const keyOf = (j: JobItem) => `${j.slug}|${j.anchor}`;
  const isPinned = (j: JobItem) => pinOverride[keyOf(j)] ?? j.pinned;
  const attOf = (j: JobItem): "" | "love" | "no" => attOverride[keyOf(j)] ?? j.attitude;

  const togglePin = async (j: JobItem) => {
    if (!canWrite || busyKey) return;
    const to = !isPinned(j);
    const key = keyOf(j);
    setBusyKey(key);
    setPinOverride((o) => ({ ...o, [key]: to }));
    setMsg(d.jobs.submitting);
    try {
      await saveOpeningPin(j.slug, j.anchor, to, j.title);
      setMsg(to ? d.jobs.pinAdded : d.jobs.pinRemoved);
    } catch (e) {
      setPinOverride((o) => ({ ...o, [key]: !to }));
      setMsg(`✗ ${e instanceof Error ? e.message : d.jobs.submitFailed}`);
    } finally {
      setBusyKey("");
      setTimeout(() => setMsg(""), 6000);
    }
  };

  const cycleAttitude = async (j: JobItem) => {
    if (!canWrite || busyKey) return;
    const cur = attOf(j);
    const to = NEXT_ATT[cur];
    const key = keyOf(j);
    setBusyKey(key);
    setAttOverride((o) => ({ ...o, [key]: to }));
    setMsg(d.jobs.submitting);
    try {
      await saveOpeningAttitude(j.slug, j.anchor, to, j.title);
      setMsg(
        to === "love"
          ? d.jobs.attLove
          : to === "no"
          ? d.jobs.attNo
          : d.jobs.attCleared
      );
    } catch (e) {
      setAttOverride((o) => ({ ...o, [key]: cur }));
      setMsg(`✗ ${e instanceof Error ? e.message : d.jobs.submitFailed}`);
    } finally {
      setBusyKey("");
      setTimeout(() => setMsg(""), 6000);
    }
  };

  const companies = useMemo(
    () => Array.from(new Set(jobs.map((j) => j.company))),
    [jobs]
  );
  const pinnedCount = jobs.filter((j) => !j.excluded && isPinned(j)).length;
  const loveCount = jobs.filter((j) => !j.excluded && attOf(j) === "love").length;

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    const fit = (j: JobItem) => j.stars + (j.hot ? 3 : 0);
    const byDefault = (a: JobItem, b: JobItem) =>
      Number(isPinned(b)) - Number(isPinned(a)) ||
      attWeight(attOf(b)) - attWeight(attOf(a)) ||
      a.tier - b.tier ||
      fit(b) - fit(a) ||
      a.company.localeCompare(b.company);
    const sorters: Record<string, (a: JobItem, b: JobItem) => number> = {
      "": byDefault,
      att: (a, b) =>
        attWeight(attOf(b)) - attWeight(attOf(a)) ||
        Number(isPinned(b)) - Number(isPinned(a)) ||
        a.tier - b.tier ||
        fit(b) - fit(a),
      fit: (a, b) => fit(b) - fit(a) || a.tier - b.tier,
      co: (a, b) => a.company.localeCompare(b.company) || a.tier - b.tier,
      new: (a, b) => (b.sectionDate || "").localeCompare(a.sectionDate || ""),
    };
    return jobs
      .filter((j) => (showExcluded ? true : !j.excluded))
      .filter((j) => (hideNo ? attOf(j) !== "no" : true))
      .filter((j) => (onlyPinned ? isPinned(j) : true))
      .filter((j) => (tier ? j.tier === Number(tier) : true))
      .filter((j) => (company ? j.company === company : true))
      .filter((j) =>
        kw
          ? (j.title + j.location + j.company + j.html).toLowerCase().includes(kw)
          : true
      )
      .sort(sorters[sortBy] ?? byDefault);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs, q, tier, company, sortBy, showExcluded, hideNo, onlyPinned, pinOverride, attOverride]);

  return (
    <>
      <div className="filters">
        <input
          placeholder={d.jobs.searchPlaceholder}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} title={d.jobs.sortTitle}>
          <option value="">{d.jobs.sortDefault}</option>
          <option value="att">{d.jobs.sortAtt}</option>
          <option value="fit">{d.jobs.sortFit}</option>
          <option value="co">{d.jobs.sortCo}</option>
          <option value="new">{d.jobs.sortNew}</option>
        </select>
        <select value={tier} onChange={(e) => setTier(e.target.value)}>
          <option value="">{d.jobs.allTiers}</option>
          <option value="1">{d.jobs.tier1}</option>
          <option value="2">{d.jobs.tier2}</option>
          <option value="3">{d.jobs.tier3}</option>
        </select>
        <select value={company} onChange={(e) => setCompany(e.target.value)}>
          <option value="">{d.jobs.allCompanies}</option>
          {companies.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <label className="muted small" style={{ alignSelf: "center" }}>
          <input
            type="checkbox"
            checked={onlyPinned}
            onChange={(e) => setOnlyPinned(e.target.checked)}
          />{" "}
          {d.jobs.onlyPinned(pinnedCount)}
        </label>
        <label className="muted small" style={{ alignSelf: "center" }}>
          <input
            type="checkbox"
            checked={hideNo}
            onChange={(e) => setHideNo(e.target.checked)}
          />{" "}
          {d.jobs.hideNo}
        </label>
        <label className="muted small" style={{ alignSelf: "center" }}>
          <input
            type="checkbox"
            checked={showExcluded}
            onChange={(e) => setShowExcluded(e.target.checked)}
          />{" "}
          {d.jobs.includeExcluded}
        </label>
      </div>

      <p className="muted small">
        {d.jobs.summary(filtered.length, pinnedCount, loveCount)}
        {canWrite ? d.jobs.summaryCanWrite : d.jobs.summaryReadOnly}
      </p>
      {msg && <p className="small">{msg}</p>}

      <div className="card">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>📌</th>
                <th title={d.jobs.thAttTitle}>{d.jobs.thAtt}</th>
                <th>{d.jobs.thCompany}</th>
                <th>{d.jobs.thFit}</th>
                <th>{d.jobs.thRole}</th>
                <th>{d.jobs.thLocation}</th>
                <th>{d.jobs.thFetched}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((j) => (
                <tr key={keyOf(j)} style={j.excluded ? { opacity: 0.55 } : undefined}>
                  <td data-label={d.jobs.dlList}>
                    {!j.excluded && (
                      <button
                        className={`pin-btn ${isPinned(j) ? "on" : ""}`}
                        disabled={!canWrite || !!busyKey}
                        onClick={() => togglePin(j)}
                        title={
                          canWrite
                            ? isPinned(j)
                              ? d.jobs.pinUnpinTitle
                              : d.jobs.pinAddTitle
                            : d.jobs.pinDisabledTitle
                        }
                      >
                        {isPinned(j) ? "📌" : "＋"}
                      </button>
                    )}
                  </td>
                  <td data-label={d.jobs.dlAtt}>
                    {!j.excluded && (
                      <button
                        className={`pin-btn att-${attOf(j) || "none"}`}
                        disabled={!canWrite || !!busyKey}
                        onClick={() => cycleAttitude(j)}
                        title={
                          canWrite
                            ? d.jobs.attCycleTitle
                            : d.jobs.attDisabledTitle
                        }
                      >
                        {ATT_ICON[attOf(j)]}
                      </button>
                    )}
                  </td>
                  <td data-label={d.jobs.dlCompany} style={{ whiteSpace: "nowrap" }}>
                    <Link href={`/companies/${j.slug}`}>{j.company}</Link>{" "}
                    <span className={`tier-badge tier-${j.tier}`}>
                      {["", "一", "二", "三"][j.tier]}
                    </span>
                  </td>
                  <td data-label={d.jobs.dlFit} style={{ whiteSpace: "nowrap" }}>
                    {j.hot ? "🎯" : ""}
                    {"⭐".repeat(j.stars)}
                  </td>
                  <td data-label={d.jobs.dlRole} dangerouslySetInnerHTML={{ __html: j.html }} />
                  <td className="muted" data-label={d.jobs.dlLocation}>{j.location}</td>
                  <td className="muted small" data-label={d.jobs.dlFetched} style={{ whiteSpace: "nowrap" }}>
                    {j.sectionDate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
