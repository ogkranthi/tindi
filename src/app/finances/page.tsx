import ComingSoon from "@/components/ComingSoon";
import { MODULES } from "@/lib/modules";

export default function FinancesPage() {
  return <ComingSoon module={MODULES.find((m) => m.id === "finances")!} />;
}
