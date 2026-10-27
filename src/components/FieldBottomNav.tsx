"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/field", icon: "home", label: "Home" },
  { href: "/field/apply", icon: "assignment", label: "Apply" },
  { href: "/field/sync", icon: "sync", label: "Sync" },
];

export function FieldBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 py-3 bg-surface border-t border-outline-variant md:hidden">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              active
                ? "flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-full px-4 py-1 transition-all duration-200"
                : "flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container-highest rounded-full px-4 py-1 transition-all duration-200"
            }
          >
            <span
              className="material-symbols-outlined"
              style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {item.icon}
            </span>
            <span className="text-[10px] font-bold tracking-wider uppercase mt-1">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
