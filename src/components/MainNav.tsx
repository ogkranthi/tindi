"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MODULES } from "@/lib/modules";

export default function MainNav() {
  const pathname = usePathname() || "/";
  const active = MODULES.filter((m) => m.status === "active");

  const current = active.find(
    (m) =>
      pathname === m.href ||
      pathname.startsWith(m.href + "/") ||
      (m.links?.some((l) => pathname === l.href || pathname.startsWith(l.href + "/")) ?? false)
  );
  const subLinks = current?.links ?? [];

  return (
    <header className="border-b border-stone-200 bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-herb-700">
          <span className="text-2xl">🌿</span> Tindi
        </Link>
        <nav className="flex flex-wrap gap-1 text-sm">
          {active.map((m) => {
            const isActive = current?.id === m.id;
            return (
              <Link
                key={m.id}
                href={m.href}
                className={`rounded-lg px-3 py-1.5 ${
                  isActive
                    ? "bg-herb-100 font-medium text-herb-700"
                    : "text-stone-600 hover:bg-herb-50 hover:text-herb-700"
                }`}
              >
                <span className="mr-1">{m.icon}</span>
                {m.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {subLinks.length > 0 && (
        <div className="border-t border-stone-100 bg-white/40">
          <nav className="mx-auto flex max-w-5xl flex-wrap gap-1 px-4 py-2 text-sm">
            {subLinks.map((l) => {
              const isActive = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`rounded-lg px-3 py-1 ${
                    isActive
                      ? "bg-herb-100 font-medium text-herb-700"
                      : "text-stone-600 hover:bg-herb-50 hover:text-herb-700"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
