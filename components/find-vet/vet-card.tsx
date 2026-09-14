"use client";

import { KeyboardEvent } from "react";
import { Clock, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VetResult } from "@/lib/vets/types";

type VetCardProps = {
  vet: VetResult;
  rank: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
};

export function VetCard({ vet, rank, isSelected, onSelect }: VetCardProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(vet.id);
    }
  }

  return (
    <div
      id={`vet-card-${vet.id}`}
      role="button"
      tabIndex={0}
      aria-current={isSelected ? "true" : undefined}
      className={cn(
        "group flex gap-3 border-l-[3px] py-3 pl-3 pr-1 transition-colors cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:rounded-sm",
        isSelected
          ? "border-l-primary bg-primary/5"
          : "border-l-transparent hover:border-l-secondary/40"
      )}
      onClick={() => onSelect(vet.id)}
      onKeyDown={handleKeyDown}
    >
      <span
        className={cn(
          "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full font-heading text-xs font-semibold",
          isSelected
            ? "bg-primary text-primary-foreground"
            : "bg-secondary/10 text-secondary group-hover:bg-secondary/20 dark:text-secondary-foreground"
        )}
      >
        {rank}
      </span>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="truncate text-sm font-medium leading-snug text-foreground">
            {vet.name}
          </h3>
          {vet.distanceKm !== undefined ? (
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
              {vet.distanceKm.toFixed(1)} km
            </span>
          ) : null}
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">
          {vet.address}
        </p>

        {vet.phone || vet.hours ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5 text-xs text-muted-foreground">
            {vet.phone ? (
              <a
                className="inline-flex items-center gap-1 hover:text-primary"
                href={`tel:${vet.phone}`}
                onClick={(event) => event.stopPropagation()}
              >
                <Phone className="size-3" aria-hidden />
                {vet.phone}
              </a>
            ) : null}
            {vet.hours ? (
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3" aria-hidden />
                {vet.hours}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

