import Image from "next/image";
import Link from "next/link";
import { FieldBottomNav } from "@/components/FieldBottomNav";

export default function FieldLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col relative pb-20 md:pb-0">
      <header className="bg-surface border-b border-outline-variant flex justify-between items-center w-full px-4 h-16 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.svg"
            alt="Pathways Bank Logo"
            width={32}
            height={32}
            className="w-8 h-8 rounded-sm object-cover"
          />
          <h1 className="text-xl font-headline font-bold text-primary">Pathways Field</h1>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin"
            className="hover:bg-surface-container-low p-2 rounded-full active:scale-95 transition-transform duration-150"
            title="Admin Cockpit View"
          >
            <span className="material-symbols-outlined text-primary">admin_panel_settings</span>
          </Link>
          <button className="hover:bg-surface-container-low p-2 rounded-full active:scale-95 transition-transform duration-150">
            <span className="material-symbols-outlined text-primary">account_circle</span>
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto w-full max-w-2xl mx-auto">{children}</main>
      <FieldBottomNav />
    </div>
  );
}
