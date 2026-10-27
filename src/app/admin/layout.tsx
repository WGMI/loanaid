import Image from "next/image";
import Link from "next/link";
import { AdminNavLink } from "@/components/AdminNavLink";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background text-on-background min-h-screen flex">
      <nav className="fixed left-0 top-0 h-full w-[280px] bg-surface-admin border-r border-outline-variant flex flex-col py-6 z-20">
        <div className="px-6 mb-8 flex items-center gap-3">
          <Image
            src="/logo.svg"
            alt="Pathways Bank Logo"
            width={40}
            height={40}
            className="h-10 w-10 rounded-sm object-contain bg-white"
          />
          <div>
            <h1 className="text-2xl font-headline font-black text-primary leading-tight">
              Admin Cockpit
            </h1>
            <p className="text-xs font-bold tracking-wider uppercase text-on-surface-variant">
              Pathways Bank
            </p>
          </div>
        </div>
        <ul className="flex-1 flex flex-col gap-1 mt-4">
          <li>
            <AdminNavLink href="/admin" icon="dashboard" label="Dashboard" />
          </li>
          <li>
            <AdminNavLink href="/admin/loans" icon="payments" label="Loans" />
          </li>
          <li>
            <AdminNavLink href="/admin/products" icon="inventory_2" label="Products" />
          </li>
          <li>
            <AdminNavLink href="/admin/scoring" icon="tune" label="Scoring Engine" />
          </li>
        </ul>
        <div className="mt-auto flex flex-col gap-1 border-t border-outline-variant pt-4">
          <Link
            className="text-on-surface-variant flex items-center gap-3 px-6 py-3 hover:bg-surface-container-high transition-colors"
            href="/"
          >
            <span className="material-symbols-outlined">smartphone</span>
            <span className="text-xs font-bold tracking-wider uppercase">Field App View</span>
          </Link>
          <a
            className="text-on-surface-variant flex items-center gap-3 px-6 py-3 hover:bg-surface-container-high transition-colors"
            href="#"
          >
            <span className="material-symbols-outlined">help</span>
            <span className="text-xs font-bold tracking-wider uppercase">Support</span>
          </a>
        </div>
      </nav>
      <div className="flex-1 ml-[280px] w-full flex flex-col">
        <header className="bg-surface border-b border-outline-variant shadow-sm sticky top-0 z-10">
          <div className="flex justify-between items-center w-full px-8 h-16">
            <h2 className="text-2xl font-headline font-bold text-primary">Pathways Admin</h2>
            <div className="flex-1 max-w-md mx-8 hidden md:block">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">
                  search
                </span>
                <input
                  className="w-full bg-surface-container-low border-none rounded pl-10 pr-4 py-2 text-sm focus:ring-1 focus:ring-primary focus:outline-none placeholder-on-surface-variant"
                  placeholder="Search loans, applicants..."
                  type="text"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="text-on-surface-variant hover:text-primary transition-all duration-200 p-2 rounded-full hover:bg-surface-container-high">
                <span className="material-symbols-outlined">notifications</span>
              </button>
              <button className="text-on-surface-variant hover:text-primary transition-all duration-200 p-2 rounded-full hover:bg-surface-container-high">
                <span className="material-symbols-outlined">apps</span>
              </button>
              <div className="h-8 w-8 rounded-full border border-outline-variant bg-primary text-on-primary flex items-center justify-center text-xs font-bold">
                AU
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
