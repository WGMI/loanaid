"use client";

import { useState, useTransition } from "react";
import type { LoanApplication } from "@/lib/types";
import { formatNaira, formatDate } from "@/lib/format";
import { overrideDecision } from "@/app/admin/loans/actions";
import { ScoreExplanationDialog } from "./ScoreExplanationDialog";

type Row = LoanApplication & {
  product_name?: string;
  officer_name?: string;
  scoring_config_name?: string;
};

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

function humanize(key: string) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

export function ReviewDialog({ row }: { row: Row }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function decide(newStatus: "approved" | "declined") {
    startTransition(async () => {
      await overrideDecision(row.id, newStatus);
      setOpen(false);
    });
  }

  const submittedFields = row.submitted_fields ? Object.entries(row.submitted_fields) : [];
  const breakdown = row.score_breakdown ? Object.entries(row.score_breakdown) : [];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-primary text-on-primary px-3 py-1 rounded hover:bg-primary-container transition-colors text-xs font-bold uppercase"
      >
        Review
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="relative bg-surface-container-lowest rounded-xl shadow-lg max-w-lg w-full max-h-[85vh] overflow-y-auto">
            <div className="p-6 border-b border-outline-variant flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-headline text-on-surface">{row.applicant_name}</h3>
                <p className="text-xs text-on-surface-variant font-data-mono">
                  {row.national_id} · {row.app_code}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-on-surface-variant hover:text-on-surface shrink-0"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 flex flex-col gap-5">
              {row.knocked_out && (
                <div className="px-3 py-2 rounded bg-status-error/10 border border-status-error/30 text-status-error text-sm">
                  Knocked out on field <span className="font-data-mono">{row.knock_out_field}</span>
                </div>
              )}

              <div className="flex items-center justify-between bg-surface-container-low rounded p-4">
                <div>
                  <p className="text-xs font-bold uppercase text-on-surface-variant mb-1">
                    Credit Score
                  </p>
                  <p
                    className={`font-data-mono text-4xl font-bold ${
                      row.tier ? tierScoreClass[row.tier] : "text-on-surface-variant"
                    }`}
                  >
                    {row.score ?? "—"}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${
                    row.tier ? tierBadge[row.tier] : "border-outline-variant text-on-surface-variant"
                  }`}
                >
                  {row.decision ?? "Pending"}
                </span>
              </div>

              {row.score != null && (
                <ScoreExplanationDialog applicationId={row.id} />
              )}

              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-on-surface-variant text-xs uppercase font-bold">Product</dt>
                  <dd className="text-on-surface font-semibold">{row.product_name}</dd>
                </div>
                <div>
                  <dt className="text-on-surface-variant text-xs uppercase font-bold">Scorecard</dt>
                  <dd className="text-on-surface font-semibold">{row.scoring_config_name ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-on-surface-variant text-xs uppercase font-bold">Officer</dt>
                  <dd className="text-on-surface font-semibold">{row.officer_name}</dd>
                </div>
                <div>
                  <dt className="text-on-surface-variant text-xs uppercase font-bold">State</dt>
                  <dd className="text-on-surface font-semibold">{row.region}</dd>
                </div>
                <div>
                  <dt className="text-on-surface-variant text-xs uppercase font-bold">Amount Requested</dt>
                  <dd className="text-on-surface font-semibold">{formatNaira(row.amount_ngn)}</dd>
                </div>
                <div>
                  <dt className="text-on-surface-variant text-xs uppercase font-bold">Date Applied</dt>
                  <dd className="text-on-surface font-semibold">{formatDate(row.applied_at)}</dd>
                </div>
                <div>
                  <dt className="text-on-surface-variant text-xs uppercase font-bold">Phone</dt>
                  <dd className="text-on-surface font-semibold font-data-mono">{row.phone}</dd>
                </div>
              </dl>

              {breakdown.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase text-on-surface-variant mb-2">
                    Score Breakdown
                  </p>
                  <div className="flex flex-col gap-1">
                    {breakdown.map(([group, points]) => (
                      <div
                        key={group}
                        className="flex justify-between text-sm bg-surface-container-low rounded px-3 py-1.5"
                      >
                        <span className="text-on-surface-variant">{group}</span>
                        <span className="font-data-mono text-on-surface">{String(points)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {submittedFields.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase text-on-surface-variant mb-2">
                    Submitted Data
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {submittedFields.map(([key, value]) => (
                      <div key={key} className="bg-surface-container-low rounded px-3 py-1.5">
                        <p className="text-[10px] uppercase text-on-surface-variant">
                          {humanize(key)}
                        </p>
                        <p className="text-sm text-on-surface font-data-mono truncate">
                          {key === "gpsLocation"
                            ? value
                              ? "Captured"
                              : "Not captured"
                            : String(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-outline-variant flex items-center justify-end gap-3">
              {row.status === "manual_review" ? (
                <>
                  <button
                    disabled={isPending}
                    onClick={() => decide("declined")}
                    className="px-4 py-2 border border-status-error text-status-error rounded text-sm font-bold uppercase hover:bg-status-error/10 transition-colors disabled:opacity-50"
                  >
                    Decline
                  </button>
                  <button
                    disabled={isPending}
                    onClick={() => decide("approved")}
                    className="px-4 py-2 bg-status-success text-white rounded text-sm font-bold uppercase hover:bg-status-success/90 transition-colors disabled:opacity-50"
                  >
                    Approve
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 border border-outline-variant rounded text-sm font-bold uppercase text-on-surface-variant hover:bg-surface-container-low transition-colors"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
