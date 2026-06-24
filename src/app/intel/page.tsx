import type { Metadata } from "next";
import Link from "next/link";
import { getJds } from "@/lib/data";
import { getDict } from "@/i18n/server";

export const metadata: Metadata = { title: "情报 · JD 档案" };

export default async function IntelPage() {
  const jds = getJds();
  const d = await getDict();
  return (
    <>
      <h1 className="page-title">{d.intel.title}</h1>
      <p className="page-sub">
        {d.intel.subPre}
        <Link href="/docs/strategy/perm-by-company">perm-by-company.md</Link>
        {d.intel.subPost}
      </p>
      <div className="card">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>{d.intel.colJd}</th>
                <th>{d.intel.colLevel}</th>
                <th>{d.intel.colLocation}</th>
                <th>{d.intel.colComp}</th>
                <th>{d.intel.colFlag}</th>
              </tr>
            </thead>
            <tbody>
              {jds.map((j) => (
                <tr key={j.file} style={j.flagged ? { opacity: 0.6 } : undefined}>
                  <td style={{ minWidth: 220 }} data-label={d.intel.colJd}>
                    <Link href={`/docs/intel/jd/${j.file}`}>{j.title}</Link>
                  </td>
                  <td style={{ minWidth: 90 }} data-label={d.intel.colLevel}>{j.level}</td>
                  <td style={{ minWidth: 90 }} data-label={d.intel.colLocation}>{j.location}</td>
                  <td style={{ minWidth: 110 }} data-label={d.intel.colComp}>{j.comp}</td>
                  <td data-label={d.intel.colFlag}>
                    {j.flagged === "CONTRACT" && <span className="pill red">{d.intel.contract}</span>}
                    {j.flagged === "ARCHIVED" && <span className="pill gray">{d.intel.archived}</span>}
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
