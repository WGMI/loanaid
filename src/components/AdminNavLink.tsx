"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminNavLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: string;
  label: string;
}) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      className={
        active
          ? "text-primary font-bold border-r-4 border-primary bg-primary-fixed/20 flex items-center gap-3 px-6 py-3 transition-colors"
          : "text-on-surface-variant flex items-center gap-3 px-6 py-3 hover:bg-surface-container-high transition-colors"
      }
    >
      <span className="material-symbols-outlined">{icon}</span>
      <span className="text-xs font-bold tracking-wider uppercase">{label}</span>
    </Link>
  );
}
