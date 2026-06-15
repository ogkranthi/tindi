import { listMembers } from "@/lib/db";
import FamilyEditor from "@/components/FamilyEditor";

export const dynamic = "force-dynamic";

export default function FamilyPage() {
  const members = listMembers();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Family profiles</h1>
        <p className="mt-1 text-stone-600">
          This is the context every meal plan is built around. Keep it current — pregnancy stage,
          new conditions, what the toddler will actually eat this month.
        </p>
      </div>
      <FamilyEditor members={members} />
    </div>
  );
}
