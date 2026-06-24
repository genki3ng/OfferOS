"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useDict } from "@/i18n/client";
import { getToken, sendRequestToClaude } from "@/lib/githubClient";

const KINDS = [
  "出题练习",
  "准备材料",
  "Mock 面试",
  "扫岗/调研",
  "面试日程",
  "投递记录",
  "面试复盘",
  "拍板决策",
  "改简历",
  "其他",
];

// kind 值（数据，写回 inbox）→ i18n 显示标签 key
const KIND_KEYS: Record<string, keyof ReturnType<typeof useDict>["ask"]["kinds"]> = {
  "出题练习": "practice",
  "准备材料": "material",
  "Mock 面试": "mock",
  "扫岗/调研": "scan",
  "面试日程": "schedule",
  "投递记录": "apply",
  "面试复盘": "retro",
  "拍板决策": "decide",
  "改简历": "resume",
  "其他": "other",
};

/**
 * 全局"派活给 Claude"：写一条 status:new 请求进 inbox/，
 * 下个 Claude session 开场扫 inbox 时自动处理（CLAUDE.md 仪式第 5 步）。
 */
export default function AskClaude() {
  const d = useDict();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [kind, setKind] = useState(KINDS[0]);
  const [topic, setTopic] = useState("");
  const [detail, setDetail] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setHasToken(!!getToken());
  }, [open]);

  // 其它组件可通过自定义事件预填并打开（如练习页"要更多题"）
  useEffect(() => {
    const fn = (e: Event) => {
      const d = (e as CustomEvent).detail ?? {};
      if (d.kind) setKind(d.kind);
      if (d.topic) setTopic(d.topic);
      if (d.detail) setDetail(d.detail);
      setState("idle");
      setOpen(true);
    };
    window.addEventListener("ask-claude", fn);
    return () => window.removeEventListener("ask-claude", fn);
  }, []);

  if (pathname === "/login") return null;

  const submit = async () => {
    if (!topic.trim()) {
      setMsg(d.ask.needTopic);
      return;
    }
    setState("saving");
    setMsg("");
    try {
      const path = await sendRequestToClaude({
        topic,
        detail,
        kind,
        context: pathname ?? "",
      });
      setState("done");
      setMsg(path);
      setTopic("");
      setDetail("");
    } catch (e) {
      setState("error");
      setMsg(e instanceof Error ? e.message : d.ask.submitFail);
    }
  };

  return (
    <>
      <button className="ask-fab" onClick={() => setOpen(true)} title={d.ask.fabTitle}>
        {d.ask.fab}
      </button>
      {open && (
        <div className="modal-mask" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="card-title">{d.ask.modalTitle}</div>
            <p className="muted small" style={{ marginTop: 0 }}>
              {d.ask.introPre}
              <a href="https://claude.ai/code" target="_blank" rel="noreferrer">{d.ask.introLink}</a>
              {d.ask.introPost}
            </p>
            {!hasToken ? (
              <>
                <p>
                  {d.ask.needTokenPre}<a href="/settings">{d.ask.needTokenLink}</a>{d.ask.needTokenPost}
                </p>
                {(topic || detail) && (
                  <div className="answer" style={{ marginTop: 4 }}>
                    <div className="small muted">{d.ask.keptHint}</div>
                    {topic && <p style={{ margin: "6px 0 0", fontWeight: 700 }}>{topic}</p>}
                    {detail && <p className="small" style={{ whiteSpace: "pre-wrap", marginTop: 4 }}>{detail}</p>}
                  </div>
                )}
                <p style={{ marginTop: 10 }}>
                  <a className="btn" href="/settings">{d.ask.goSetToken}</a>
                </p>
              </>
            ) : state === "done" ? (
              <div>
                <p>
                  {d.ask.donePre}<code className="small">{msg}</code>
                </p>
                <p className="muted small">
                  {d.ask.doneHint}
                </p>
                <button className="btn" onClick={() => setState("idle")}>
                  {d.ask.askAgain}
                </button>{" "}
                <button className="btn ghost" onClick={() => setOpen(false)}>
                  {d.ask.close}
                </button>
              </div>
            ) : (
              <>
                <div className="chips">
                  {KINDS.map((k) => (
                    <button
                      key={k}
                      className={`chip ${k === kind ? "on" : ""}`}
                      onClick={() => setKind(k)}
                    >
                      {d.ask.kinds[KIND_KEYS[k]] ?? k}
                    </button>
                  ))}
                </div>
                <input
                  className="field"
                  placeholder={d.ask.topicPlaceholder}
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
                <textarea
                  className="field"
                  rows={5}
                  placeholder={d.ask.detailPlaceholder}
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                />
                {msg && <p className="login-err small">{msg}</p>}
                <div>
                  <button className="btn" onClick={submit} disabled={state === "saving"}>
                    {state === "saving" ? d.ask.submitting : d.ask.submit}
                  </button>{" "}
                  <button className="btn ghost" onClick={() => setOpen(false)}>
                    {d.ask.cancel}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
