import ComingSoon from "@/components/ComingSoon";
import { MODULES } from "@/lib/modules";

export default function SubscriptionsPage() {
  return <ComingSoon module={MODULES.find((m) => m.id === "subscriptions")!} />;
}
