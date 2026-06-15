import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { HEALTH_MODULE } from "@/lib/modules";

export const metadata: Metadata = {
  title: "Tindi — your family OS",
  description: "AI meal plans, grocery lists, and personalized health insights for the family.",
};

// The header surfaces the active module's sub-pages.
const nav = [{ href: "/", label: "Home" }, ...(HEALTH_MODULE.links ?? [])];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen">
          <header className="border-b border-stone-200 bg-white/70 backdrop-blur">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
              <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-herb-700">
                <span className="text-2xl">🌿</span> Tindi
              </Link>
              <nav className="flex gap-1 text-sm">
                {nav.map((n) => (
                  <Link
                    key={n.href}
                    href={n.href}
                    className="rounded-lg px-3 py-1.5 text-stone-600 hover:bg-herb-50 hover:text-herb-700"
                  >
                    {n.label}
                  </Link>
                ))}
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
