import Link from "next/link";
import { getOfficerByName, getOfficerApplications } from "@/lib/data";
import { formatNaira } from "@/lib/format";

const FIELD_OFFICER_NAME = "Officer John Eze";

const statusMeta: Record<
  string,
  { label: string; badge: string; icon: string; iconClass: string }
> = {
  draft: {
    label: "DRAFT",
    badge: "bg-surface-variant text-on-surface-variant border border-outline-variant",
    icon: "edit",
    iconClass: "text-outline",
  },
  queued: {
    label: "PENDING",
    badge: "bg-status-warning/20 text-status-warning",
    icon: "sync",
    iconClass: "text-outline",
  },
  uploading: {
    label: "PENDING",
    badge: "bg-status-warning/20 text-status-warning",
    icon: "sync",
    iconClass: "text-status-info",
  },
  sync_failed: {
    label: "FAILED",
    badge: "bg-status-error/20 text-status-error",
    icon: "error",
    iconClass: "text-status-error",
  },
  submitted: {
    label: "SYNCED",
    badge: "bg-status-success/20 text-status-success",
    icon: "cloud_done",
    iconClass: "text-status-success",
  },
  manual_review: {
    label: "SYNCED",
    badge: "bg-status-success/20 text-status-success",
    icon: "cloud_done",
    iconClass: "text-status-success",
  },
  approved: {
    label: "SYNCED",
    badge: "bg-status-success/20 text-status-success",
    icon: "cloud_done",
    iconClass: "text-status-success",
  },
  declined: {
    label: "SYNCED",
    badge: "bg-status-success/20 text-status-success",
    icon: "cloud_done",
    iconClass: "text-status-success",
  },
};

export default async function FieldHomePage() {
  const officer = await getOfficerByName(FIELD_OFFICER_NAME);
  const apps = officer ? await getOfficerApplications(officer.id, 6) : [];
  const pending = apps.filter((a) => ["queued", "uploading", "sync_failed"].includes(a.status));

  return (
    <div className="relative">
      <main className="px-4 py-6 md:px-8">
        <section className="mb-6">
          <h2 className="text-2xl font-headline text-primary mb-1">
            Welcome back, {officer ? officer.name.replace("Officer ", "") : "Officer"}
          </h2>
          <p className="text-base text-on-surface-variant">Here is your daily summary.</p>
        </section>

        {pending.length > 0 ? (
          <section className="bg-surface-container-low border-l-4 border-status-warning rounded p-4 mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-status-warning">cloud_off</span>
              <div>
                <h3 className="text-base font-semibold text-on-surface">Offline Mode</h3>
                <p className="text-sm text-on-surface-variant">
                  {pending.length} item{pending.length > 1 ? "s" : ""} pending upload
                </p>
              </div>
            </div>
            <Link href="/field/sync" className="text-primary font-semibold text-sm hover:underline">
              Sync Now
            </Link>
          </section>
        ) : (
          <section className="bg-status-success/10 border-l-4 border-status-success rounded p-4 mb-8 flex items-center gap-3">
            <span className="material-symbols-outlined text-status-success">cloud_done</span>
            <div>
              <h3 className="text-base font-semibold text-on-surface">All Synced</h3>
              <p className="text-sm text-on-surface-variant">No pending uploads.</p>
            </div>
          </section>
        )}

        <section>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-primary">Recent Applications</h3>
            <Link href="/field/sync" className="text-primary font-semibold text-sm hover:underline">
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {apps.map((app) => {
              const meta = statusMeta[app.status] ?? statusMeta.draft;
              return (
                <div
                  key={app.id}
                  className="bg-surface-field border border-outline-variant rounded p-4 flex flex-col gap-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-base font-semibold text-on-surface">
                        {app.product_name} — {app.applicant_name}
                      </h4>
                      <p className="font-data-mono text-sm text-on-surface-variant">{app.app_code}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${meta.badge}`}>
                      {meta.label}
                    </span>
                  </div>
                  <div className="flex justify-between items-end border-t border-surface-container pt-3">
                    <div className="text-sm text-on-surface-variant">
                      Applicant: {app.applicant_name}
                      <br />
                      Amount: {formatNaira(app.amount_ngn)}
                    </div>
                    <span className={`material-symbols-outlined ${meta.iconClass}`}>{meta.icon}</span>
                  </div>
                </div>
              );
            })}
            {apps.length === 0 && (
              <p className="text-sm text-on-surface-variant">No applications yet. Start a new one below.</p>
            )}
          </div>
        </section>
      </main>

      <Link
        href="/field/apply"
        className="fixed bottom-24 right-4 md:bottom-8 md:right-8 bg-primary text-on-primary w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-primary-container transition-colors z-50"
      >
        <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          add
        </span>
      </Link>
    </div>
  );
}
