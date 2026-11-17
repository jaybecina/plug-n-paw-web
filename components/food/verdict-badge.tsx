import { Ban, Check, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Species, Verdict } from "@/content/types";

const styles: Record<Verdict, string> = {
  safe: "bg-sev-routine text-sev-routine-fg",
  caution: "bg-sev-soon text-sev-soon-fg",
  toxic: "bg-sev-emergency text-sev-emergency-fg",
};
const labels: Record<Verdict, string> = {
  safe: "Safe",
  caution: "Use caution",
  toxic: "Toxic",
};
const icons = { safe: Check, caution: TriangleAlert, toxic: Ban };

export function VerdictBadge({
  verdict,
  species,
  className,
}: {
  verdict: Verdict;
  species?: Species;
  className?: string;
}) {
  const Icon = icons[verdict];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        styles[verdict],
        className
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {species && (
        <span className="font-medium capitalize opacity-80">{species}:</span>
      )}
      {labels[verdict]}
    </span>
  );
}
