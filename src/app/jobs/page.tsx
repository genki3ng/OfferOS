import type { Metadata } from "next";
import { getOpenings } from "@/lib/data";
import { renderInline } from "@/lib/markdown";
import { getDict } from "@/i18n/server";
import JobsTable, { JobItem } from "./JobsTable";

export const metadata: Metadata = { title: "岗位库" };

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
    html: renderInline(o.raw, "pipeline/companies"),
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
