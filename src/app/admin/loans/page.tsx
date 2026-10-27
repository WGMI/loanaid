import Link from "next/link";
import { getReviewQueue, getRegions } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { ReviewDialog } from "@/components/ReviewDialog";

const tierBadge: Record<string, string> = {
  green: "bg-status-success/10 text-status-success border-status-success/20",
  amber: "bg-status-warning/10 text-status-warning border-status-warning/20",
  red: "bg-status-error/10 text-status-error border-status-error/20",
};
const tierScoreClass: Record<string, string> = {
  green: "text-status-success",
  amber: "text-status-warning",
  red: "text-status-error",
};

function tabClass(active: boolean) {
  return active
    ? "px-3 py-1.5 text-sm bg-surface-container-high rounded-sm text-on-surface"
    : "px-3 py-1.5 text-sm text-on-surface-variant hover:bg-surface-container-low rounded-sm flex items-center gap-1";
}

export default async function LoanReviewQueuePage({
  searchParams,
}: PageProps<"/admin/loans">) {
  const sp = await searchParams;
  const tier = (Array.isArray(sp.tier) ? sp.tier[0] : sp.tier) ?? "all";
  const region = (Array.isArray(sp.region) ? sp.region[0] : sp.region) ?? "all";
  const page = Number((Array.isArray(sp.page) ? sp.page[0] : sp.page) ?? "1") || 1;
  const pageSize = 8;

  const [{ rows, total }, regions] = await Promise.all([
    getReviewQueue({
      tier: tier as "all" | "green" | "amber" | "red",
      region,
      page,
      pageSize,
    }),
    getRegions(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize + (rows.length ? 1 : 0);
  const end = (page - 1) * pageSize + rows.length;

  function qs(overrides: Record<string, string>) {
    const params = new URLSearchParams({ tier, region, page: String(page) });
    for (const [k, v] of Object.entries(overrides)) params.set(k, v);
    return `/admin/loans?${params.toString()}`;
  }

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-headline text-on-surface mb-1">Loan Review Queue</h2>
          <p className="text-base text-on-surface-variant">
            Pending applications requiring back-office approval.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex gap-2 bg-surface-container-lowest p-1 rounded border border-outline-variant">
            <Link href={qs({ tier: "all", page: "1" })} className={tabClass(tier === "all")}>
              All
            </Link>
            <Link href={qs({ tier: "green", page: "1" })} className={tabClass(tier === "green")}>
              <span className="w-2 h-2 rounded-full bg-status-success" /> Green
            </Link>
            <Link href={qs({ tier: "amber", page: "1" })} className={tabClass(tier === "amber")}>
              <span className="w-2 h-2 rounded-full bg-status-warning" /> Amber
            </Link>
            <Link href={qs({ tier: "red", page: "1" })} className={tabClass(tier === "red")}>
              <span className="w-2 h-2 rounded-full bg-status-error" /> Red
            </Link>
          </div>
          <form action="/admin/loans" className="flex gap-2">
            <input type="hidden" name="tier" value={tier} />
            <select
              name="region"
              defaultValue={region}
              className="bg-surface-container-lowest text-sm border border-outline-variant rounded px-3 py-2 outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All States</option>
              {regions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="px-3 py-2 text-sm border border-outline-variant rounded hover:bg-surface-container-low text-on-surface-variant"
            >
              Filter
            </button>
          </form>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded border border-outline-variant overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                <th className="py-3 px-4 text-xs font-bold uppercase text-on-surface-variant">Applicant</th>
                <th className="py-3 px-4 text-xs font-bold uppercase text-on-surface-variant">Product</th>
                <th className="py-3 px-4 text-xs font-bold uppercase text-on-surface-variant">Score (RAG)</th>
                <th className="py-3 px-4 text-xs font-bold uppercase text-on-surface-variant">Officer</th>
                <th className="py-3 px-4 text-xs font-bold uppercase text-on-surface-variant">Date Applied</th>
                <th className="py-3 px-4 text-xs font-bold uppercase text-on-surface-variant text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {rows.map((row, i) => (
                <tr
                  key={row.id}
                  className={`border-b border-outline-variant hover:bg-surface-container-low transition-colors h-[48px] ${
                    i % 2 === 1 ? "bg-surface-admin" : ""
                  }`}
                >
                  <td className="py-2 px-4">
                    <div className="font-semibold text-on-surface">{row.applicant_name}</div>
                    <div className="text-on-surface-variant text-xs">ID: {row.national_id}</div>
                  </td>
                  <td className="py-2 px-4 text-on-surface">
                    {row.product_name}
                    {row.scoring_config_name && (
                      <div className="text-on-surface-variant text-xs">
                        {row.scoring_config_name}
                      </div>
                    )}
                  </td>
                  <td className="py-2 px-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-data-mono font-bold text-sm ${
                          row.tier ? tierScoreClass[row.tier] : "text-on-surface-variant"
                        }`}
                      >
                        {row.score ?? "—"}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${
                          row.tier ? tierBadge[row.tier] : "border-outline-variant text-on-surface-variant"
                        }`}
                      >
                        {row.decision ?? "Pending"}
                      </span>
                    </div>
                  </td>
                  <td className="py-2 px-4 text-on-surface-variant">{row.officer_name}</td>
                  <td className="py-2 px-4 font-data-mono text-on-surface-variant">
                    {formatDate(row.applied_at)}
                  </td>
                  <td className="py-2 px-4 text-right">
                    <ReviewDialog row={row} />
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-on-surface-variant">
                    No applications match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-outline-variant flex items-center justify-between bg-surface">
          <span className="text-sm text-on-surface-variant">
            Showing {start} to {end} of {total} entries
          </span>
          <div className="flex gap-1">
            <Link
              href={qs({ page: String(Math.max(1, page - 1)) })}
              className={`px-2 py-1 rounded text-sm ${
                page <= 1
                  ? "text-on-surface-variant opacity-50 pointer-events-none"
                  : "text-on-surface-variant hover:bg-surface-container-low"
              }`}
            >
              Prev
            </Link>
            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((p) => (
              <Link
                key={p}
                href={qs({ page: String(p) })}
                className={`px-2 py-1 rounded text-sm ${
                  p === page
                    ? "bg-primary text-on-primary"
                    : "text-on-surface-variant hover:bg-surface-container-low"
                }`}
              >
                {p}
              </Link>
            ))}
            <Link
              href={qs({ page: String(Math.min(totalPages, page + 1)) })}
              className={`px-2 py-1 rounded text-sm ${
                page >= totalPages
                  ? "text-on-surface-variant opacity-50 pointer-events-none"
                  : "text-on-surface-variant hover:bg-surface-container-low"
              }`}
            >
              Next
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
