"use client";

import { useEffect, useState } from "react";
import {
  getToken,
  setToken,
  ghTestToken,
  REPO,
  syncWallpaperToRepo,
  removeWallpaperFromRepo,
} from "@/lib/githubClient";
import {
  getWallpaper,
  getRepoWallpaper,
  isWallpaperOff,
  markWallpaperSynced,
  clearWallpaperOff,
  saveWallpaper,
  fileToDataURL,
} from "@/lib/wallpaper";
import { useDict } from "@/i18n/client";

function WallpaperCard() {
  const d = useDict();
  const [wp, setWp] = useState<string | null>(null); // 本地副本/URL 壁纸
  const [repoWp, setRepoWp] = useState<string | null>(null); // 仓库壁纸（构建时烤入）
  const [off, setOff] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setWp(getWallpaper());
    setRepoWp(getRepoWallpaper());
    setOff(isWallpaperOff());
    setHasToken(!!getToken());
  }, []);

  const preview = wp ?? (off ? null : repoWp);

  const onFile = async (f: File | undefined) => {
    if (!f || busy) return;
    setBusy(true);
    setMsg(d.settings.compressing);
    try {
      const data = await fileToDataURL(f);
      saveWallpaper(data); // 本设备即时生效
      setWp(data);
      setOff(false);
      if (getToken()) {
        setMsg(d.settings.syncingToRepo);
        try {
          await syncWallpaperToRepo(data);
          markWallpaperSynced();
          setMsg(d.settings.syncedToRepo);
        } catch (e) {
          setMsg(
            d.settings.deviceOkRepoFailed(e instanceof Error ? e.message : d.settings.unknownError)
          );
        }
      } else {
        setMsg(d.settings.setDeviceOnly);
      }
    } catch (e) {
      setMsg(d.settings.errorPrefix(e instanceof Error ? e.message : d.settings.readImageFailed));
    } finally {
      setBusy(false);
    }
  };

  const [url, setUrl] = useState("");
  const applyUrl = () => {
    try {
      saveWallpaper(url.trim());
      setWp(url.trim());
      setOff(false);
      setMsg(d.settings.setUrlWallpaper);
    } catch (e) {
      setMsg(d.settings.errorPrefix(e instanceof Error ? e.message : d.settings.failed));
    }
  };

  const clear = async () => {
    if (busy) return;
    setBusy(true);
    try {
      saveWallpaper(null);
      setWp(null);
      setOff(isWallpaperOff());
      if (getToken() && repoWp) {
        setMsg(d.settings.clearingRepoWallpaper);
        try {
          await removeWallpaperFromRepo();
          setMsg(d.settings.clearedWithRepo);
        } catch (e) {
          setMsg(
            d.settings.deviceClearedRepoFailed(e instanceof Error ? e.message : d.settings.unknownError)
          );
        }
      } else if (repoWp) {
        setMsg(d.settings.deviceWallpaperOff);
      } else {
        setMsg(d.settings.clearedToDefault);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card section" style={{ maxWidth: 640 }}>
      <div className="card-title">{d.settings.wallpaperTitle}</div>
      <p className="muted small">
        {d.settings.wallpaperIntroPre}<b>{d.settings.wallpaperIntroTheme}</b>{d.settings.wallpaperIntroPost}
        {hasToken ? (
          <>{d.settings.wallpaperHasToken}<b>{d.settings.wallpaperHasTokenBold}</b>{d.settings.wallpaperHasTokenEnd}</>
        ) : (
          <>{d.settings.wallpaperNoToken}</>
        )}
      </p>
      <input
        type="file"
        accept="image/*"
        disabled={busy}
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <input
          className="field"
          style={{ margin: 0, flex: 1 }}
          placeholder={d.settings.wallpaperUrlPlaceholder}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button
          className="btn"
          disabled={!/^https?:\/\//.test(url) || busy}
          onClick={applyUrl}
        >
          {d.settings.apply}
        </button>
      </div>
      {preview && (
        <div style={{ marginTop: 12 }}>
          <div
            style={{
              height: 110,
              borderRadius: 12,
              backgroundImage: `url("${preview.replace(/"/g, '\\"')}")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              border: "1px solid var(--line)",
            }}
          />
          <p className="muted small" style={{ margin: "6px 0 0" }}>
            {d.settings.currentSourcePrefix}{wp ? d.settings.sourceDevice : d.settings.sourceRepo}
          </p>
          <button className="btn ghost" style={{ marginTop: 8 }} disabled={busy} onClick={clear}>
            {d.settings.clearWallpaper}
          </button>
        </div>
      )}
      {!preview && off && repoWp && (
        <p className="muted small">
          {d.settings.offWithRepoPrefix}
          <button
            className="btn mini ghost"
            onClick={() => {
              clearWallpaperOff();
              location.reload();
            }}
          >
            {d.settings.restoreRepoWallpaper}
          </button>
        </p>
      )}
      {msg && <p className="small" style={{ marginBottom: 0 }}>{msg}</p>}
    </div>
  );
}

export default function SettingsPage() {
  const d = useDict();
  const [token, setTok] = useState("");
  const [saved, setSaved] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setTok(getToken());
    setSaved(!!getToken());
  }, []);

  const save = () => {
    setToken(token);
    setSaved(!!token);
    setMsg(token ? d.settings.savedToBrowser : d.settings.cleared);
  };

  const test = async () => {
    setMsg(d.settings.testing);
    try {
      setToken(token);
      setMsg("✅ " + (await ghTestToken()));
      setSaved(!!token);
    } catch (e) {
      setMsg(d.settings.errorPrefix(e instanceof Error ? e.message : d.settings.failed));
    }
  };

  return (
    <>
      <h1 className="page-title">{d.settings.pageTitle}</h1>
      <p className="page-sub">{d.settings.pageSub}</p>

      <div className="card section" style={{ maxWidth: 640 }}>
        <div className="card-title">{d.settings.tokenCardTitle}</div>
        <p className="muted small">
          {d.settings.tokenIntroPre}<code>{REPO}</code>{d.settings.tokenIntroPost}<b>{d.settings.tokenIntroDevice}</b>{d.settings.tokenIntroEnd}
        </p>
        <p className="small" style={{ color: "var(--sage-deep)", marginTop: 0 }}>
          {d.settings.tokenTrustPre}<code>{REPO}</code>{d.settings.tokenTrustPost}
        </p>
        <input
          className="field"
          type="password"
          placeholder={d.settings.tokenPlaceholder}
          value={token}
          onChange={(e) => setTok(e.target.value)}
        />
        <div style={{ marginTop: 10 }}>
          <button className="btn" onClick={save}>
            {d.settings.save}
          </button>{" "}
          <button className="btn ghost" onClick={test}>
            {d.settings.testConnection}
          </button>{" "}
          {saved && (
            <button
              className="btn ghost"
              onClick={() => {
                setTok("");
                setToken("");
                setSaved(false);
                setMsg(d.settings.cleared);
              }}
            >
              {d.settings.clear}
            </button>
          )}
        </div>
        {msg && <p className="small" style={{ marginBottom: 0 }}>{msg}</p>}
      </div>

      <WallpaperCard />

      <div className="card" style={{ maxWidth: 640 }}>
        <div className="card-title">{d.settings.howToTitle}</div>
        <ol className="small" style={{ paddingLeft: 18, margin: 0 }}>
          <li>
            {d.settings.howToStep1Pre}<code>{REPO}</code>{d.settings.howToStep1Post}<b>{d.settings.howToStep1Perm}</b>{d.settings.howToStep1End}
          </li>
          <li>
            {d.settings.howToStep2Pre}<code>github_pat_…</code>{d.settings.howToStep2Mid}<b>{d.settings.howToStep2Save}</b>{d.settings.howToStep2Then}<b>{d.settings.howToStep2Test}</b>{d.settings.howToStep2End}
          </li>
          <li>{d.settings.howToStep3}</li>
        </ol>
        <p className="muted small" style={{ marginTop: 8, marginBottom: 0 }}>
          {d.settings.howToNote}
        </p>
      </div>
    </>
  );
}
