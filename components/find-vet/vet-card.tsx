"use client";

import { KeyboardEvent } from "react";
import { MapPin, Navigation, Phone } from "lucide-react";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { VetResult } from "@/lib/vets/types";

type VetCardProps = {
  vet: VetResult;
  isSelected: boolean;
  onSelect: (id: string) => void;
};

export function VetCard({ vet, isSelected, onSelect }: VetCardProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(vet.id);
    }
  }

  return (
    <Card
      id={`vet-card-${vet.id}`}
      role="button"
      tabIndex={0}
      aria-current={isSelected ? "true" : undefined}
      size="sm"
      className={cn(
        "cursor-pointer rounded-lg border border-transparent bg-card/95 shadow-sm ring-1 ring-border transition hover:border-primary/30 hover:ring-primary/30 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        isSelected &&
          "border-primary/50 bg-primary/5 ring-primary/40 dark:bg-primary/10"
      )}
      onClick={() => onSelect(vet.id)}
      onKeyDown={handleKeyDown}
    >
      <CardHeader className="gap-2">
        <CardTitle className="pr-2 text-sm leading-snug">{vet.name}</CardTitle>
        {vet.distanceKm !== undefined ? (
          <CardAction className="rounded-full bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
            {vet.distanceKm.toFixed(1)} km
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p className="flex gap-2 leading-relaxed">
          <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <span>{vet.address}</span>
        </p>
        <div className="flex flex-wrap gap-2 text-xs">
          {vet.phone ? (
            <a
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-foreground transition hover:border-primary/40 hover:text-primary"
              href={`tel:${vet.phone}`}
              onClick={(event) => event.stopPropagation()}
            >
              <Phone className="size-3.5" aria-hidden />
              {vet.phone}
            </a>
          ) : null}
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-foreground">
            <Navigation className="size-3.5" aria-hidden />
            View on map
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

