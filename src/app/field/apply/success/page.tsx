import Link from "next/link";
import { ScoreExplanationDialog } from "@/components/ScoreExplanationDialog";

const tierStyles: Record<string, { ring: string; text: string; bg: string; icon: string }> = {
  green: { ring: "ring-status-success", text: "text-status-success", bg: "bg-status-success/10", icon: "check_circle" },
  amber: { ring: "ring-status-warning", text: "text-status-warning", bg: "bg-status-warning/10", icon: "pending_actions" },
  red: { ring: "ring-status-error", text: "text-status-error", bg: "bg-status-error/10", icon: "cancel" },
};

export default async function SubmissionSuccessPage({
  searchParams,
}: PageProps<"/field/apply/success">) {
  const sp = await searchParams;
  const applicationId = Number(sp.id);
  const code = String(sp.code ?? "—");
  const score = String(sp.score ?? "—");
  const tier = String(sp.tier ?? "amber");
  const decision = String(sp.decision ?? "Manual Review");
  const style = tierStyles[tier] ?? tierStyles.amber;

  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center gap-6">
      <div className={`w-24 h-24 rounded-full ${style.bg} flex items-center justify-center ring-4 ${style.ring}`}>
        <span className={`material-symbols-outlined text-5xl ${style.text}`} style={{ fontVariationSettings: "'FILL' 1" }}>
          {style.icon}
        </span>
      </div>
      <div>
        <h1 className="text-2xl font-headline text-primary mb-1">Application Submitted</h1>
        <p className="text-on-surface-variant font-data-mono text-sm">{code}</p>
      </div>

      <div className="bg-surface-field border border-outline-variant rounded-xl p-6 w-full max-w-sm flex flex-col gap-4">
        <div>
          <p className="text-xs font-bold uppercase text-on-surface-variant mb-1">Credit Score</p>
          <p className={`font-data-mono text-5xl font-bold ${style.text}`}>{score}</p>
          <p className="text-xs text-on-surface-variant">out of 1000</p>
        </div>
        <div className="pt-4 border-t border-outline-variant">
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${style.bg} ${style.text}`}>
            {decision}
          </span>
        </div>
      </div>

      <p className="text-sm text-on-surface-variant max-w-sm">
        Scored instantly against the alternative-data engine — no credit bureau file required.
      </p>

      {applicationId > 0 && (
        <ScoreExplanationDialog
          applicationId={applicationId}
          triggerClassName="flex items-center gap-1.5 px-4 py-2 rounded-full border border-primary text-primary text-sm font-bold uppercase hover:bg-surface-container-low transition-colors"
        />
      )}

      <div className="flex gap-3">
        <Link
          href="/field"
          className="px-6 py-3 rounded-full border border-primary text-primary text-sm font-bold uppercase hover:bg-surface-container-low transition-colors"
        >
          Back to Dashboard
        </Link>
        <Link
          href="/field/apply"
          className="px-6 py-3 rounded-full bg-primary text-on-primary text-sm font-bold uppercase hover:bg-primary/90 transition-colors shadow-sm"
        >
          New Application
        </Link>
      </div>
    </div>
  );
}
