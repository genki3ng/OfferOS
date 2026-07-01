/**
 * 跟进雷达（Follow-up radar）——纯逻辑，构建端与浏览器端共用（不碰 fs / DOM）。
 *
 * 回答一个问题：某家「已投 / 已内推 / 面完」后沉默了太久，该主动去催了吗？
 * 数据源 = data/tracker.json 每家的 `lastContact`（最后一次动作日期）+ `awaiting`（在等什么）。
 * 天数在**浏览器实时**算（见 FollowupRadar.tsx），所以不重新部署也不会过期。
 */

/** 在等什么 → 决定用哪条 SLA。 */
export type AwaitingKind =
  | "recruiter-referred" // 内推已提交，等 recruiter 首次联系
  | "recruiter-applied" // 自己网申，等 recruiter 首次联系（冷申请，本就更慢）
  | "next-round" // 一轮面完，等约下一轮 / 出结果
  | "connection"; // LinkedIn 连接请求已发，等对方通过

/**
 * SLA：沉默满多少天算「该催了」。**改这里就能调提醒力度**。
 * 当前 = 标准档（内推 14 · 自投 21 · 面后 7 · 连接 7）。
 * 激进档可用 10/14/5/5；宽松档 18/28/10/10。
 */
export const SLA_DAYS: Record<AwaitingKind, number> = {
  "recruiter-referred": 14,
  "recruiter-applied": 21,
  "next-round": 7,
  connection: 7,
};

/** 进入 SLA 最后这一段比例 → 标「快到线」。0.25 = 最后 1/4 窗口。 */
const SOON_RATIO = 0.25;

export type FollowupLevel = "overdue" | "soon" | "ok";

export interface FollowupInput {
  slug: string | null;
  name: string;
  perm?: string;
  role?: string;
  lastContact?: string; // YYYY-MM-DD
  awaiting?: string;
}

export interface FollowupItem extends FollowupInput {
  awaiting: AwaitingKind;
  lastContact: string;
  daysSilent: number;
  sla: number;
  /** 正 = 已超线天数；负 = 距到线还有几天。排序键（大在前 = 最急）。 */
  overBy: number;
  level: FollowupLevel;
}

const KNOWN: AwaitingKind[] = [
  "recruiter-referred",
  "recruiter-applied",
  "next-round",
  "connection",
];

/** 两个 YYYY-MM-DD 之间的整天数（按本地日历日，避免时区/夏令时误差）。 */
export function daysBetween(fromISO: string, todayISO: string): number {
  const [fy, fm, fd] = fromISO.split("-").map(Number);
  const [ty, tm, td] = todayISO.split("-").map(Number);
  if (!fy || !ty) return 0;
  const a = Date.UTC(fy, fm - 1, fd);
  const b = Date.UTC(ty, tm - 1, td);
  return Math.round((b - a) / 86400000);
}

/** 单家：算出沉默天数与档位。数据不全（没 lastContact / awaiting 不认识）→ null。 */
export function computeFollowup(
  row: FollowupInput,
  todayISO: string
): FollowupItem | null {
  const awaiting = row.awaiting as AwaitingKind;
  if (!row.lastContact || !KNOWN.includes(awaiting)) return null;
  const sla = SLA_DAYS[awaiting];
  const daysSilent = Math.max(0, daysBetween(row.lastContact, todayISO));
  const soonAt = sla - Math.ceil(sla * SOON_RATIO);
  const level: FollowupLevel =
    daysSilent >= sla ? "overdue" : daysSilent >= soonAt ? "soon" : "ok";
  return {
    ...row,
    awaiting,
    lastContact: row.lastContact,
    daysSilent,
    sla,
    overBy: daysSilent - sla,
    level,
  };
}

/** 全部等回复的公司 → 按紧急度排序（最该催的在前）。 */
export function collectFollowups(
  rows: FollowupInput[],
  todayISO: string
): FollowupItem[] {
  return rows
    .map((r) => computeFollowup(r, todayISO))
    .filter((x): x is FollowupItem => x !== null)
    .sort((a, b) => b.overBy - a.overBy);
}
