import { getKpis, getRecentActivity } from "@/lib/data";
import { formatNaira, relativeTime } from "@/lib/format";

const actionIcon: Record<
  string,
  { icon: string; wrap: string; text: string; badge: string }
> = {
  "STP APPROVE": {
    icon: "check_circle",
    wrap: "bg-status-success/10 text-status-success",
    text: "text-status-success",
    badge: "bg-status-success text-white",
  },
  APPROVE: {
    icon: "check_circle",
    wrap: "bg-status-success/10 text-status-success",
    text: "text-status-success",
    badge: "bg-status-success text-white",
  },
  "MANUAL REVIEW": {
    icon: "pending_actions",
    wrap: "bg-status-warning/10 text-status-warning",
    text: "text-status-warning",
    badge: "bg-status-warning text-white",
  },
  DECLINED: {
    icon: "cancel",
    wrap: "bg-status-error/10 text-status-error",
    text: "text-status-error",
    badge: "bg-status-error text-white",
  },
};
const defaultActionIcon = {
  icon: "info",
  wrap: "bg-surface-container-high text-on-surface-variant",
  text: "text-on-surface-variant",
  badge: "bg-surface-container-high text-on-surface-variant",
};

export default async function AdminDashboardPage() {
  const [kpis, activity] = await Promise.all([getKpis(), getRecentActivity(6)]);

  const pending = Number(kpis.pending);
  const failed = Number(kpis.failed);
  const syncHealthy = pending === 0 && failed === 0;

  return (
    <div className="p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-surface-field border border-outline-variant rounded p-4 flex flex-col gap-2">
          <p className="text-xs font-bold tracking-wider uppercase text-on-surface-variant">
            Total Loan Volume
          </p>
          <div className="flex items-end gap-2">
            <h3 className="text-3xl font-headline text-primary">
              {formatNaira(kpis.total_volume)}
            </h3>
            <span className="text-sm text-status-success flex items-center mb-1 gap-0.5">
              <span className="material-symbols-outlined text-base">trending_up</span> 12%
            </span>
          </div>
        </div>
        <div className="bg-surface-field border border-outline-variant rounded p-4 flex flex-col gap-2">
          <p className="text-xs font-bold tracking-wider uppercase text-on-surface-variant">
            Active Officers
          </p>
          <div className="flex items-end gap-2">
            <h3 className="text-3xl font-headline text-primary">{kpis.active_officers}</h3>
            <span className="text-sm text-on-surface-variant mb-1">in field</span>
          </div>
        </div>
        <div className="bg-surface-field border border-outline-variant rounded p-4 flex flex-col gap-2 relative overflow-hidden">
          <p className="text-xs font-bold tracking-wider uppercase text-on-surface-variant">
            Approval Rate
          </p>
          <div className="flex items-end gap-2 z-10">
            <h3 className="text-3xl font-headline text-primary">{kpis.approval_rate}%</h3>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-12 opacity-20 bg-gradient-to-t from-primary to-transparent pointer-events-none" />
        </div>
        <div className="bg-surface-field border border-outline-variant rounded p-4 flex flex-col gap-2">
          <p className="text-xs font-bold tracking-wider uppercase text-on-surface-variant">
            Sync Health
          </p>
          <div className="flex items-center gap-3 h-full">
            <div
              className={`h-10 w-10 rounded-full flex items-center justify-center ${
                syncHealthy
                  ? "bg-status-success/20 text-status-success"
                  : "bg-status-warning/20 text-status-warning"
              }`}
            >
              <span className="material-symbols-outlined">
                {syncHealthy ? "cloud_done" : "cloud_sync"}
              </span>
            </div>
            <div>
              <p className="text-base font-bold text-on-surface">
                {syncHealthy ? "Optimal" : `${pending} pending`}
              </p>
              <p className="text-sm text-on-surface-variant">
                {failed > 0 ? `${failed} failed upload(s)` : "All clients reporting"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface-field border border-outline-variant rounded flex flex-col min-h-[400px]">
          <div className="p-4 border-b border-outline-variant">
            <h3 className="text-2xl font-headline text-primary">Loan Coverage by State</h3>
          </div>
          <div className="flex-1 bg-surface-container-low relative flex items-center justify-center">
            <div className="text-center text-on-surface-variant p-8">
              <span className="material-symbols-outlined text-5xl mb-2 block">map</span>
              <p className="text-sm">
                Live coverage across Lagos, Abuja, Kano, Port Harcourt, Ibadan &amp; Enugu
              </p>
            </div>
            <div className="absolute bottom-4 right-4 flex flex-col gap-2">
              <button className="bg-surface-field p-2 rounded border border-outline-variant shadow-sm hover:bg-surface-container-low">
                <span className="material-symbols-outlined">add</span>
              </button>
              <button className="bg-surface-field p-2 rounded border border-outline-variant shadow-sm hover:bg-surface-container-low">
                <span className="material-symbols-outlined">remove</span>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-surface-field border border-outline-variant rounded flex flex-col h-full">
          <div className="p-4 border-b border-outline-variant">
            <h3 className="text-2xl font-headline text-primary">Recent Activity</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {activity.map((item) => {
              const meta = actionIcon[item.action] ?? defaultActionIcon;
              return (
                <div key={item.id} className="flex gap-3 items-start">
                  <div
                    className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${meta.wrap}`}
                  >
                    <span className="material-symbols-outlined text-[18px]">{meta.icon}</span>
                  </div>
                  <div className="flex-1 border-b border-outline-variant pb-3 last:border-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <p className="text-sm font-bold text-on-surface">
                        {item.applicant_name} — {item.app_code}
                      </p>
                      <p className="text-xs font-bold uppercase text-on-surface-variant">
                        {relativeTime(item.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded-sm text-xs font-bold uppercase ${meta.badge}`}>
                        {item.action}
                      </span>
                      <span className="font-data-mono text-xs text-on-surface-variant">
                        Score: {item.score}
                      </span>
                    </div>
                    <p className="text-sm text-on-surface-variant">{item.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
