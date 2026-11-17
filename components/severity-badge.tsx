import { CircleCheck, Clock, Siren, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { SEVERITY_LABEL, type TriageSeverity } from "@/lib/triage/types";

const styles: Record<TriageSeverity, string> = {
  routine: "bg-sev-routine text-sev-routine-fg",
  soon: "bg-sev-soon text-sev-soon-fg",
  urgent: "bg-sev-urgent text-sev-urgent-fg",
  emergency: "bg-sev-emergency text-sev-emergency-fg",
};

const icons = {
  routine: CircleCheck,
  soon: Clock,
  urgent: TriangleAlert,
  emergency: Siren,
};

export function SeverityBadge({
  severity,
  className,
}: {
  severity: TriageSeverity;
  className?: string;
}) {
  const Icon = icons[severity];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold",
        styles[severity],
        className
      )}
    >
      <Icon className="size-4" aria-hidden="true" />
      {SEVERITY_LABEL[severity]}
    </span>
  );
}
