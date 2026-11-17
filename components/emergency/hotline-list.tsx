"use client";

import { Phone } from "lucide-react";
import { useHotlineRegion } from "@/hooks/use-hotline-region";
import { COUNTRY_OPTIONS } from "@/lib/hotlines";
import { cn } from "@/lib/utils";

type Variant = "card" | "band" | "inline";

const selectStyles: Record<Variant, string> = {
  card: "border-border bg-card text-foreground",
  band: "border-secondary-foreground/30 bg-secondary text-secondary-foreground",
  inline: "border-sev-emergency-fg/40 bg-sev-emergency text-sev-emergency-fg",
};

export function HotlineList({
  variant,
  className,
}: {
  variant: Variant;
  className?: string;
}) {
  const { region, choose, ready } = useHotlineRegion();
  const selectId = `hotline-country-${variant}`;

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <label htmlFor={selectId} className="opacity-80">
          Showing numbers for
        </label>
        <select
          id={selectId}
          value={region.code}
          onChange={(e) => choose(e.target.value)}
          className={cn(
            "h-9 rounded-lg border px-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current",
            selectStyles[variant]
          )}
        >
          {COUNTRY_OPTIONS.map((option) => (
            <option key={option.code} value={option.code}>
              {option.name}
            </option>
          ))}
        </select>
      </div>

      <div aria-live="polite" className="mt-4">
        {!ready ? (
          <p className="text-sm opacity-80">Finding hotlines for your country…</p>
        ) : region.lines.length === 0 ? (
          <p className={cn(variant === "inline" ? "text-sm" : "text-base")}>
            {region.note}
          </p>
        ) : (
          <>
            <ul className={cn("space-y-3", variant === "card" && "grid gap-4 space-y-0 sm:grid-cols-2")}>
              {region.lines.map((line) => (
                <li key={line.tel}>
                  {variant === "inline" ? (
                    <a
                      href={line.tel}
                      className="inline-flex items-center gap-2 rounded-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sev-emergency-fg"
                    >
                      <Phone className="size-4" aria-hidden="true" />
                      {line.name}: {line.phone}
                    </a>
                  ) : (
                    <a
                      href={line.tel}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl p-4 transition-shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                        variant === "card"
                          ? "bg-card shadow-(--shadow-soft) hover:shadow-(--shadow-lift)"
                          : "bg-secondary-foreground text-secondary hover:opacity-90 focus-visible:outline-secondary-foreground"
                      )}
                    >
                      <Phone className="size-5 shrink-0" aria-hidden="true" />
                      <span>
                        <span className="block text-sm font-medium opacity-80">
                          {line.name}
                        </span>
                        <span className="block font-heading text-lg font-semibold">
                          {line.phone}
                        </span>
                      </span>
                    </a>
                  )}
                </li>
              ))}
            </ul>
            <p className={cn("mt-3 text-sm", variant !== "inline" && "opacity-80")}>
              {region.note}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
