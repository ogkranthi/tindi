import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tindi — family health & food",
  description: "AI meal plans, grocery lists, and health insights for the whole family.",
};

const nav = [
  { href: "/", label: "Home" },
  { href: "/meal-plan", label: "Meal Plan" },
  { href: "/grocery", label: "Grocery" },
  { href: "/family", label: "Family" },
];

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
