import { renderInline, splitLogSegments } from "@/lib/markdown";
import { pillClass } from "@/lib/data";
import LogSteps from "./LogSteps";

const plainLen = (s: string) =>
  Array.from(s.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[*`~]/g, "")).length;

/** tracker 状态字段（PERM/内推…）的排版出口：
 *  短语 → 彩色 pill（原样）；日志长句 → 同色系「便签块」+ 分行步骤（LogSteps）。
 *  不再把长文塞进 inline-flex 的 pill 里挤成一坨。 */
export default function NoteField({
  value,
  prefix = "",
  baseDir = "pipeline",
  max = 3,
}: {
  value: string;
  prefix?: string;
  baseDir?: string;
  max?: number;
}) {
  const segs = splitLogSegments(value);
  if (segs.length <= 1 && plainLen(value) <= 42) {
    return (
      <span
        className={`${pillClass(value)} note`}
        dangerouslySetInnerHTML={{ __html: (prefix ? prefix + " " : "") + renderInline(value, baseDir) }}
      />
    );
  }
  return (
    <div className={pillClass(value).replace("pill ", "note-line ")}>
      {prefix && <span className="nl-lbl">{prefix}</span>}
      <LogSteps
        items={segs.map((g) => ({ icon: g.icon, html: renderInline(g.text, baseDir) }))}
        max={max}
      />
    </div>
  );
}
