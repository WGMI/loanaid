"use client";

import { useState, useTransition } from "react";
import { testFormula } from "@/app/admin/scoring/[id]/actions";

export function FormulaTester({ getFormula }: { getFormula: () => string }) {
  const [contextJson, setContextJson] = useState('{\n  \n}');
  const [result, setResult] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isPending, startTransition] = useTransition();

  function runTest() {
    startTransition(async () => {
      const res = await testFormula(getFormula(), contextJson);
      if (res.contextError) {
        setIsError(true);
        setResult(res.contextError);
      } else if (res.error) {
        setIsError(true);
        setResult(res.error);
      } else {
        setIsError(false);
        setResult(res.value === null ? "(no formula — contributes 0)" : `Raw score: ${res.value}`);
      }
    });
  }

  return (
    <div className="mt-2 flex flex-col gap-2 bg-surface-container-low rounded p-2 border border-outline-variant/50">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase text-on-surface-variant">
          Test context (JSON)
        </span>
        <button
          type="button"
          onClick={runTest}
          disabled={isPending}
          className="ml-auto text-xs text-primary hover:bg-primary/10 px-2 py-0.5 rounded border border-primary/30 disabled:opacity-50"
        >
          {isPending ? "Running…" : "Validate"}
        </button>
      </div>
      <textarea
        value={contextJson}
        onChange={(e) => setContextJson(e.target.value)}
        rows={2}
        className="w-full px-2 py-1 border border-outline-variant rounded font-data-mono text-xs bg-surface-container-lowest focus:ring-1 focus:ring-primary outline-none"
      />
      {result && (
        <p className={`text-xs font-data-mono ${isError ? "text-status-error" : "text-status-success"}`}>
          {result}
        </p>
      )}
    </div>
  );
}
