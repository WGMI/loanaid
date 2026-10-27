"use client";

import { useState } from "react";

export function TiersSection({
  greenMin,
  amberMin,
}: {
  greenMin: number;
  amberMin: number;
}) {
  const [green, setGreen] = useState(greenMin);
  const [amber, setAmber] = useState(amberMin);

  // Same staleness risk as GroupsFieldsBuilder: this component stays mounted across
  // the page's other server actions (add/delete group or field), which revalidate and
  // pass fresh tier thresholds down as props. Adjust local state during render instead
  // of an effect (https://react.dev/learn/you-might-not-need-an-effect).
  const [prevMins, setPrevMins] = useState({ greenMin, amberMin });
  if (prevMins.greenMin !== greenMin || prevMins.amberMin !== amberMin) {
    setPrevMins({ greenMin, amberMin });
    setGreen(greenMin);
    setAmber(amberMin);
  }

  return (
    <div className="bg-surface-field border border-outline-variant rounded-xl p-6 shadow-sm h-full flex flex-col">
      <div className="flex items-center gap-2 mb-6 border-b border-outline-variant pb-4">
        <span className="material-symbols-outlined text-primary">stacked_bar_chart</span>
        <h3 className="text-2xl font-headline text-on-surface">Decision Tiering</h3>
      </div>
      <p className="text-sm text-on-surface-variant mb-6">
        Define score thresholds for automated RAG (Red-Amber-Green) status outputs.
      </p>
      <div className="flex-1 flex flex-col gap-4">
        <div className="p-4 border-l-4 border-status-success bg-status-success/5 rounded-r relative overflow-hidden">
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs font-bold tracking-wider uppercase text-status-success">
              STP Approve
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-on-surface-variant">Score &gt;</span>
              <input
                name="tier_green_min"
                className="w-16 px-2 py-1 border border-outline-variant rounded-sm font-data-mono bg-surface-container-lowest text-center"
                type="number"
                value={green}
                onChange={(e) => setGreen(Number(e.target.value) || 0)}
              />
            </div>
          </div>
          <p className="text-xs text-on-surface-variant">
            Applications above this score are automatically approved.
          </p>
        </div>
        <div className="p-4 border-l-4 border-status-warning bg-status-warning/5 rounded-r relative overflow-hidden">
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs font-bold tracking-wider uppercase text-on-tertiary-container">
              Manual Review
            </span>
            <div className="flex items-center gap-2">
              <input
                name="tier_amber_min"
                className="w-16 px-2 py-1 border border-outline-variant rounded-sm font-data-mono bg-surface-container-lowest text-center"
                type="number"
                value={amber}
                onChange={(e) => setAmber(Number(e.target.value) || 0)}
              />
              <span className="text-sm text-on-surface-variant">-</span>
              <input
                className="w-16 px-2 py-1 border border-outline-variant rounded-sm font-data-mono bg-surface-container-lowest text-center opacity-50"
                disabled
                type="number"
                value={green}
                readOnly
              />
            </div>
          </div>
          <p className="text-xs text-on-surface-variant">
            Requires Branch Manager intervention and physical sign-off.
          </p>
        </div>
        <div className="p-4 border-l-4 border-status-error bg-status-error/5 rounded-r relative overflow-hidden mt-auto">
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs font-bold tracking-wider uppercase text-status-error">
              Auto Decline
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-on-surface-variant">Score &lt;</span>
              <input
                className="w-16 px-2 py-1 border border-outline-variant rounded-sm font-data-mono bg-surface-container-lowest text-center opacity-50"
                disabled
                type="number"
                value={amber}
                readOnly
              />
            </div>
          </div>
          <p className="text-xs text-on-surface-variant">
            Immediate rejection. Excludes knockout rules.
          </p>
        </div>
      </div>
    </div>
  );
}
