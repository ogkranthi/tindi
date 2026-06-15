import Link from "next/link";
import type { AppModule } from "@/lib/modules";

export default function ComingSoon({ module }: { module: AppModule }) {
  return (
    <div className="space-y-4">
      <div className="text-4xl">{module.icon}</div>
      <h1 className="text-2xl font-semibold text-stone-900">{module.name}</h1>
      <p className="max-w-prose text-stone-600">{module.blurb}</p>
      <span className="chip bg-stone-100 text-stone-500">Coming soon</span>
      <div>
        <Link href="/" className="text-sm text-herb-700 hover:underline">
          ← Back to modules
        </Link>
      </div>
    </div>
  );
}
