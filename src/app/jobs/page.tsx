import type { Metadata } from "next";
import { getOpenings } from "@/lib/data";
import { renderInline } from "@/lib/markdown";
import { getDict } from "@/i18n/server";
import JobsTable, { JobItem } from "./JobsTable";

export const metadata: Metadata = { title: "岗位库" };

const APP_ICON: Record<string, string> = { applied: "📮", interview: "🗣️", offer: "🏆", rejected: "🛑" };

/** 从原文行里拆出「说明」：去掉标题（有单独的标题行）和紧随的（地点）（有单独的地点列）。 */
function descOf(raw: string, title: string): string {
  let s = raw.replace(/~~/g, "");
  const bold = `**${title}**`;
  const i = s.indexOf(bold);
  if (i >= 0) s = s.slice(i + bold.length);
  else {
    const j = s.indexOf(title);
    if (j >= 0) s = s.slice(j + title.length);
  }
  return s
    .replace(/^\s*（[^（）]*）\s*/, "")
    .replace(/^[\s—–\-:：·]+/, "")
    .trim();
}

export default async function JobsPage() {
  const d = await getDict();
  const jobs: JobItem[] = getOpenings().map((o) => ({
    company: o.company,
    slug: o.slug,
    tier: o.tier,
    stars: o.stars,
    hot: o.hot,
    pinned: o.pinned,
    attitude: o.attitude,
    excluded: o.excluded,
    title: o.title,
    location: o.location,
    anchor: o.anchor,
    appIcon: APP_ICON[o.appStatus] ?? "",
    descHtml: renderInline(descOf(o.raw, o.title), "pipeline/companies"),
    searchText: o.raw,
    sectionDate: o.sectionDate.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? o.sectionDate,
  }));

  return (
    <>
      <h1 className="page-title">{d.jobs.title}</h1>
      <p className="page-sub">{d.jobs.sub}</p>
      <JobsTable jobs={jobs} />
    </>
  );
}
