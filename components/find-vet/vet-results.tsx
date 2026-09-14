"use client";

import { useEffect, useMemo } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { VetCard } from "@/components/find-vet/vet-card";
import type { VetSearchErrorCode } from "@/hooks/use-vet-search";
import type { SearchResponse } from "@/lib/vets/types";

type VetResultsProps = {
  status: "idle" | "loading" | "success" | "error";
  data: SearchResponse | null;
  errorCode: VetSearchErrorCode | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRetry: () => void;
};

export function VetResults({
  status,
  data,
  errorCode,
  selectedId,
  onSelect,
  onRetry,
}: VetResultsProps) {
  useEffect(() => {
    if (!selectedId) {
      return;
    }

    document
      .getElementById(`vet-card-${selectedId}`)
      ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedId]);

  const subtitle = useMemo(() => {
    if (status === "success" && data?.center?.label) {
      return `Searching near ${data.center.label}`;
    }

    if (status === "success" && data) {
      return `${data.results.length} veterinary clinics found`;
    }

    return "Search by address, city, or clinic name - or use your location.";
  }, [data, status]);

  return (
    <section className="flex min-h-0 flex-1 flex-col" aria-label="Search results">
      <div className="border-b border-border px-4 py-3">
        <h2 className="font-heading text-lg font-semibold text-foreground">
          Veterinary clinics
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <ResultContent
          status={status}
          data={data}
          errorCode={errorCode}
          selectedId={selectedId}
          onSelect={onSelect}
          onRetry={onRetry}
        />
      </div>
    </section>
  );
}

function ResultContent({
  status,
  data,
  errorCode,
  selectedId,
  onSelect,
  onRetry,
}: VetResultsProps) {
  if (status === "idle") {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/40 p-5 text-sm leading-relaxed text-muted-foreground">
        Search by address, city, or clinic name - or use your location.
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="space-y-3" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            className="space-y-3 rounded-lg border border-border bg-card p-4"
            key={index}
          >
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (status === "error" && errorCode === "SEARCH_FAILED") {
    return (
      <div className="space-y-4 rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">
        <p>We could not load nearby veterinary clinics. Try again.</p>
        <Button type="button" variant="secondary" onClick={onRetry}>
          <RefreshCw aria-hidden="true" />
          Retry
        </Button>
      </div>
    );
  }

  if (data?.meta.locationNotFound) {
    return (
      <div className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">
        We could not find that location. Try a city, address, or clinic name.
      </div>
    );
  }

  if (data && data.results.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">
        No veterinary clinics found within 20 km of {data.query}. Try a
        different search.
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/70">
      {data?.results.map((vet, index) => (
        <VetCard
          key={vet.id}
          vet={vet}
          rank={index + 1}
          isSelected={selectedId === vet.id}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
