import ComingSoon from "@/components/ComingSoon";
import { MODULES } from "@/lib/modules";

export default function NotesPage() {
  return <ComingSoon module={MODULES.find((m) => m.id === "notes")!} />;
}
