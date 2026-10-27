import { getOfficerByName, getSyncQueue } from "@/lib/data";
import { syncAll, retryUpload } from "./actions";

const FIELD_OFFICER_NAME = "Officer John Eze";

export default async function SyncCenterPage() {
  const officer = await getOfficerByName(FIELD_OFFICER_NAME);
  const items = officer ? await getSyncQueue(officer.id) : [];
  const pendingCount = items.filter((i) => ["queued", "uploading", "sync_failed"].includes(i.status)).length;

  return (
    <div className="flex flex-col pb-32">
      {pendingCount > 0 && (
        <div className="w-full bg-status-info/10 flex items-center justify-center py-2 px-4 gap-2 sticky top-16 z-30">
          <span className="material-symbols-outlined text-status-info text-sm">sync</span>
          <span className="text-sm text-status-info">
            Sync pending ({pendingCount} item{pendingCount > 1 ? "s" : ""})
          </span>
        </div>
      )}

      <header className="flex flex-col items-center justify-center pt-8 pb-6 px-4">
        <h1 className="text-2xl font-headline text-primary font-bold">Sync Center</h1>
        <p className="text-sm text-on-surface-variant mt-2 text-center max-w-sm">
          Manage offline applications and upload status before ending your field session.
        </p>
      </header>

      <main className="flex-1 px-4 max-w-lg mx-auto w-full flex flex-col gap-4">
        {items.map((app) => (
          <SyncCard key={app.id} app={app} />
        ))}
        {items.length === 0 && (
          <p className="text-center text-sm text-on-surface-variant py-8">
            Nothing to sync — you&apos;re all caught up.
          </p>
        )}
      </main>

      {pendingCount > 0 && officer && (
        <form
          action={syncAll}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 bg-surface-field border border-outline-variant rounded-xl p-4 shadow-lg w-[calc(100%-2rem)] max-w-lg flex items-center justify-between"
        >
          <input type="hidden" name="officerId" value={officer.id} />
          <div className="flex flex-col">
            <span className="text-base font-bold">{pendingCount} Item{pendingCount > 1 ? "s" : ""} Pending</span>
            <span className="text-sm text-on-surface-variant">Requires stable connection</span>
          </div>
          <button
            type="submit"
            className="bg-primary text-on-primary px-6 py-3 rounded-lg font-bold text-sm hover:bg-primary/90 flex items-center gap-2"
          >
            <span className="material-symbols-outlined">cloud_upload</span>
            Sync All Now
          </button>
        </form>
      )}
    </div>
  );
}

function SyncCard({
  app,
}: {
  app: {
    id: number;
    app_code: string;
    applicant_name: string;
    product_name?: string;
    status: string;
    sync_progress_pct: number;
    sync_detail: string | null;
    sync_error: string | null;
    synced_at: string | null;
  };
}) {
  if (app.status === "submitted" || app.status === "approved" || app.status === "declined" || app.status === "manual_review") {
    return (
      <div className="bg-surface-field border border-outline-variant rounded-lg p-4 flex flex-col gap-3 shadow-sm">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-base font-bold text-on-surface">{app.app_code}</h2>
            <p className="text-sm text-on-surface-variant">
              {app.applicant_name} — {app.product_name}
            </p>
          </div>
          <span className="material-symbols-outlined text-status-success" style={{ fontVariationSettings: "'FILL' 1" }}>
            check_circle
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-status-success text-sm">cloud_done</span>
          <span className="text-xs font-bold uppercase text-status-success">SYNCED</span>
        </div>
        <div className="w-full bg-surface-variant rounded-full h-1.5 overflow-hidden">
          <div className="bg-status-success h-full w-full" />
        </div>
      </div>
    );
  }

  if (app.status === "uploading") {
    return (
      <div className="bg-surface-field border border-outline-variant rounded-lg p-4 flex flex-col gap-3 shadow-sm border-l-4 border-l-status-info">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-base font-bold text-on-surface">{app.app_code}</h2>
            <p className="text-sm text-on-surface-variant">
              {app.applicant_name} — {app.product_name}
            </p>
          </div>
          <span className="material-symbols-outlined text-status-info animate-spin" style={{ fontVariationSettings: "'FILL' 1" }}>
            sync
          </span>
        </div>
        <span className="text-xs font-bold uppercase text-status-info">
          {app.sync_detail ?? "UPLOADING"}
        </span>
        <div className="w-full bg-surface-variant rounded-full h-1.5 overflow-hidden">
          <div className="bg-status-info h-full transition-all duration-500" style={{ width: `${app.sync_progress_pct}%` }} />
        </div>
      </div>
    );
  }

  if (app.status === "sync_failed") {
    return (
      <div className="bg-surface-field border border-status-error rounded-lg p-4 flex flex-col gap-3 shadow-sm bg-error-container/20">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-base font-bold text-on-surface">{app.app_code}</h2>
            <p className="text-sm text-on-surface-variant">
              {app.applicant_name} — {app.product_name}
            </p>
          </div>
          <span className="material-symbols-outlined text-status-error" style={{ fontVariationSettings: "'FILL' 1" }}>
            error
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase text-status-error">UPLOAD FAILED — NETWORK ERROR</span>
          <p className="font-data-mono text-xs text-status-error">{app.sync_error}</p>
        </div>
        <div className="w-full bg-surface-variant rounded-full h-1.5 overflow-hidden">
          <div className="bg-status-error h-full" style={{ width: `${app.sync_progress_pct}%` }} />
        </div>
        <form action={retryUpload} className="flex justify-end mt-2">
          <input type="hidden" name="applicationId" value={app.id} />
          <button
            type="submit"
            className="bg-surface-field border border-status-error text-status-error text-sm px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-status-error/10"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
            Retry Upload
          </button>
        </form>
      </div>
    );
  }

  // queued
  return (
    <div className="bg-surface-field border border-outline-variant rounded-lg p-4 flex flex-col gap-3 shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-base font-bold text-on-surface">{app.app_code}</h2>
          <p className="text-sm text-on-surface-variant">
            {app.applicant_name} — {app.product_name}
          </p>
        </div>
        <span className="material-symbols-outlined text-on-surface-variant">schedule</span>
      </div>
      <span className="text-xs font-bold uppercase text-on-surface-variant">QUEUED FOR SYNC</span>
      <div className="w-full bg-surface-variant rounded-full h-1.5 overflow-hidden">
        <div className="bg-status-info h-full w-0" />
      </div>
    </div>
  );
}
