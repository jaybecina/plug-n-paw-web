import Link from "next/link";
import { Siren } from "lucide-react";
import { SeverityBadge } from "@/components/severity-badge";
import { buttonVariants } from "@/components/ui/button";
import { HotlineList } from "@/components/emergency/hotline-list";
import type { TriageResult } from "@/lib/triage/types";
import { cn } from "@/lib/utils";

export function ResultCard({ result }: { result: TriageResult }) {
  const emergency = result.severity === "emergency";

  return (
    <div
      className={cn(
        "rounded-3xl border p-6 sm:p-8",
        emergency
          ? "border-sev-emergency bg-sev-emergency text-sev-emergency-fg"
          : "border-border bg-card"
      )}
    >
      {emergency ? (
        <p className="flex items-center gap-2 font-heading text-2xl font-semibold sm:text-3xl">
          <Siren className="size-7 shrink-0" aria-hidden="true" />
          Emergency — seek immediate care
        </p>
      ) : (
        <SeverityBadge severity={result.severity} className="text-base" />
      )}

      <p className={cn("mt-4 text-lg leading-8", !emergency && "text-foreground")}>
        {result.advice}
      </p>

      {result.reasons && result.reasons.length > 0 && (
        <div className="mt-6">
          <h3 className="font-heading text-base font-semibold">Why this result</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {result.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={emergency ? "/find-vet?locate=1" : "/find-vet"}
          className={cn(
            buttonVariants({ size: "lg" }),
            "h-12 rounded-full px-6 text-base",
            emergency &&
              "bg-sev-emergency-fg text-sev-emergency hover:bg-sev-emergency-fg/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sev-emergency-fg"
          )}
        >
          {emergency ? "Find an emergency vet near me" : "Find a vet near me"}
        </Link>
      </div>

      {emergency && (
        <div className="mt-6 border-t border-sev-emergency-fg/30 pt-5">
          <HotlineList variant="inline" />
        </div>
      )}

      <p className={cn("mt-6 text-xs leading-5", emergency ? "opacity-90" : "text-muted-foreground")}>
        {result.disclaimer}
      </p>
    </div>
  );
}
