import Image from "next/image";
import Link from "next/link";
import { getKpis } from "@/lib/data";
import { formatNaira } from "@/lib/format";

export default async function LandingPage() {
  const kpis = await getKpis();

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary to-primary-container text-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center gap-8 max-w-3xl mx-auto">
        <Image src="/logo.svg" alt="Pathways Bank" width={64} height={64} className="rounded-lg bg-white p-1" />
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-white/70 mb-3">
            LoanAid — Pitch Demo
          </p>
          <h1 className="text-3xl md:text-4xl font-headline font-bold mb-4">
            A phone can now underwrite what a bank branch never could.
          </h1>
          <p className="text-white/80 text-base md:text-lg max-w-xl mx-auto">
            Offline-first field origination, feeding an alternative-data credit scoring
            engine — turning the absence of a credit file into a scoring input, fully
            auditable, at the point where the customer actually is.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 md:gap-8 w-full max-w-lg">
          <Stat label="Loan Volume" value={formatNaira(kpis.total_volume)} />
          <Stat label="Applications" value={kpis.total_apps} />
          <Stat label="Approval Rate" value={`${kpis.approval_rate}%`} />
        </div>

        <div className="flex flex-col md:flex-row gap-4 w-full max-w-lg pt-4">
          <Link
            href="/admin"
            className="flex-1 bg-white text-primary rounded-xl p-6 flex flex-col items-center gap-2 hover:scale-[1.02] transition-transform shadow-lg"
          >
            <span className="material-symbols-outlined text-3xl">admin_panel_settings</span>
            <span className="font-bold">Admin Cockpit</span>
            <span className="text-xs text-primary/70">Portfolio, review queue &amp; scoring config</span>
          </Link>
          <Link
            href="/field"
            className="flex-1 bg-white/10 border border-white/30 rounded-xl p-6 flex flex-col items-center gap-2 hover:bg-white/20 transition-colors shadow-lg"
          >
            <span className="material-symbols-outlined text-3xl">smartphone</span>
            <span className="font-bold">Field Officer App</span>
            <span className="text-xs text-white/70">Offline loan origination &amp; sync</span>
          </Link>
        </div>
      </div>
      <footer className="text-center text-white/50 text-xs pb-6">
        Dummy environment for pitch purposes — Pathways Bank Nigeria
      </footer>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-2xl font-headline font-bold">{value}</span>
      <span className="text-[10px] uppercase tracking-wider text-white/60">{label}</span>
    </div>
  );
}
