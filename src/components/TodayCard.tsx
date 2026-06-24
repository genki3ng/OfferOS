"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { SprintTask, SprintWeek } from "@/lib/data";
import { useDict } from "@/i18n/client";
import TaskList from "./TaskList";

const PATH = "prep/sprint-plan.md";

/** 今日聚焦：按今天日期定位 sprint 当前周。勾选交给 TaskList（可撤销、已完成折叠可找回）。 */
export default function TodayCard({
  weeks,
  parallel,
}: {
  weeks: SprintWeek[];
  parallel: SprintTask[];
}) {
  const d = useDict().todayCard;
  const [today, setToday] = useState("");
  useEffect(() => setToday(new Date().toISOString().slice(0, 10)), []);
  if (!today || !weeks.length) return null;

  const week =
    weeks.find((w) => today >= w.start && today <= w.end) ??
    weeks.find((w) => today < w.start) ??
    weeks[weeks.length - 1];
  const total = week.tasks.length;
  const doneCount = week.tasks.filter((t) => t.checked).length;
  const openParallel = parallel.filter((t) => !t.checked);

  return (
    <div className="card">
      <div className="card-title">
        {d.title(week.title.split("：")[0])}
        <Link className="more" href="/docs/prep/sprint-plan">
          {d.fullPlan}
        </Link>
      </div>
      <div className="bar slim" title={d.weekProgress(doneCount, total)}>
        <i style={{ width: `${total ? Math.round((doneCount / total) * 100) : 0}%` }} />
      </div>
      <TaskList
        path={PATH}
        items={week.tasks}
        limit={6}
        doneLabel={d.doneLabel}
        emptyText={d.emptyText}
      />
      {openParallel.length > 0 && (
        <>
          <div className="muted small" style={{ margin: "10px 0 4px" }}>
            {d.parallelTrack}
          </div>
          <TaskList path={PATH} items={openParallel} limit={3} />
        </>
      )}
    </div>
  );
}
