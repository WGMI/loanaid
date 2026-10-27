"use client";

import { useState, useTransition } from "react";
import { explainScore, type ScoreExplanation } from "@/app/actions/scoreExplanation";
import type { Rating, FieldRating } from "@/lib/scoring/explain";

const ratingStyle: Record<Rating, { dot: string; text: string; label: string }> = {
  green: { dot: "bg-status-success", text: "text-status-success", label: "Strong" },
  amber: { dot: "bg-status-warning", text: "text-status-warning", label: "Fair" },
  red: { dot: "bg-status-error", text: "text-status-error", label: "Weak" },
};

export function ScoreExplanationDialog({
  applicationId,
  triggerClassName,
}: {
  applicationId: number;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<ScoreExplanation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpen() {
    setOpen(true);
    if (!data && !error) {
      startTransition(async () => {
        try {
          const result = await explainScore(applicationId);
          setData(result);
        } catch {
          setError("Couldn't generate an explanation for this application.");
        }
      });
    }
  }

  const groups = new Map<string, FieldRating[]>();
  if (data) {
    for (const f of data.fieldRatings) {
      if (!groups.has(f.groupName)) groups.set(f.groupName, []);
      groups.get(f.groupName)!.push(f);
    }
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className={
          triggerClassName ??
          "flex items-center gap-1.5 px-3 py-1.5 rounded border border-primary/30 text-primary text-xs font-bold uppercase hover:bg-primary/10 transition-colors"
        }
      >
        <span className="material-symbols-outlined text-[16px]">psychology</span>
        Explain This Score
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative bg-surface-container-lowest rounded-xl shadow-lg max-w-lg w-full max-h-[85vh] overflow-y-auto">
            <div className="p-6 border-b border-outline-variant flex items-start justify-between gap-4">
              <h3 className="text-xl font-headline text-on-surface">Score Explanation</h3>
              <button
                onClick={() => setOpen(false)}
                className="text-on-surface-variant hover:text-on-surface shrink-0"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 flex flex-col gap-5">
              {isPending && (
                <p className="text-sm text-on-surface-variant">Generating explanation…</p>
              )}
              {error && <p className="text-sm text-status-error">{error}</p>}

              {data && (
                <>
                  {data.knockedOut && (
                    <div className="px-3 py-2 rounded bg-status-error/10 border border-status-error/30 text-status-error text-sm">
                      Knocked out on field <span className="font-data-mono">{data.knockOutField}</span>
                    </div>
                  )}

                  <p className="text-sm text-on-surface leading-relaxed bg-surface-container-low rounded p-4">
                    {data.narrative}
                  </p>

                  {groups.size > 0 && (
                    <div>
                      <p className="text-xs font-bold uppercase text-on-surface-variant mb-2">
                        Checklist
                      </p>
                      <div className="flex flex-col gap-4">
                        {[...groups.entries()].map(([groupName, fields]) => (
                          <div key={groupName}>
                            <p className="text-xs font-bold uppercase text-on-surface-variant mb-1.5">
                              {groupName}
                            </p>
                            <div className="flex flex-col gap-1.5">
                              {fields.map((f) => {
                                const style = ratingStyle[f.rating];
                                return (
                                  <div
                                    key={f.fieldName}
                                    className="flex items-center justify-between gap-3 bg-surface-container-low rounded px-3 py-2"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${style.dot}`} />
                                      <span className="text-sm text-on-surface truncate">{f.label}</span>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                      <span className="text-xs font-data-mono text-on-surface-variant">
                                        {String(f.submittedValue ?? "—")}
                                      </span>
                                      <span className={`text-xs font-bold uppercase ${style.text}`}>
                                        {style.label}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
