"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useDict } from "@/i18n/client";

const KEY = "jh_onboarding_dismissed";

/**
 * 首页顶部「新手上路」横幅。
 * unconfigured（data/profile.json 仍是模板态）时变成更强的「开始设置」召唤，且不可关闭，
 * 引导用户先用 /onboard 向导把它变成自己的；配置完成后回到可关闭的提示。
 */
export default function OnboardingBanner({ unconfigured = false }: { unconfigured?: boolean }) {
  const d = useDict();
  const [show, setShow] = useState(false);
  useEffect(() => {
    setShow(unconfigured || localStorage.getItem(KEY) !== "1");
  }, [unconfigured]);
  if (!show) return null;
  return (
    <div
      className="card section"
      style={{
        display: "flex",
        gap: 16,
        alignItems: "center",
        flexWrap: "wrap",
        justifyContent: "space-between",
        borderLeft: "3px solid var(--accent, #5E9A78)",
      }}
    >
      <div style={{ flex: "1 1 280px", minWidth: 260 }}>
        <div className="card-title" style={{ marginBottom: 4 }}>
          {unconfigured ? d.onboardingBanner.titleUnconfigured : d.onboardingBanner.titleConfigured}
        </div>
        <div className="muted small">
          {unconfigured ? (
            <>
              {d.onboardingBanner.unconfiguredPre}
              <strong>{d.onboardingBanner.unconfiguredBold}</strong>
              {d.onboardingBanner.unconfiguredMid}
              <Link href="/onboard">/onboard</Link>
              {d.onboardingBanner.unconfiguredAfterLink}
              <strong>{d.onboardingBanner.unconfiguredCodexBold}</strong>
              {d.onboardingBanner.unconfiguredBeforeCode}
              <code>SETUP.md</code>
              {d.onboardingBanner.unconfiguredAfterCode}
            </>
          ) : (
            <>{d.onboardingBanner.configured}</>
          )}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <Link className="btn-primary" href="/onboard">
          {unconfigured ? d.onboardingBanner.ctaUnconfigured : d.onboardingBanner.ctaConfigured}
        </Link>
        {!unconfigured && (
          <button
            className="btn-ghost"
            onClick={() => {
              localStorage.setItem(KEY, "1");
              setShow(false);
            }}
          >
            {d.onboardingBanner.dismiss}
          </button>
        )}
      </div>
    </div>
  );
}
