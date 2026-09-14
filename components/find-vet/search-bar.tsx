"use client";

import { FormEvent, useState } from "react";
import { LocateFixed, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { VetSearchErrorCode } from "@/hooks/use-vet-search";

type SearchBarProps = {
  isLoading: boolean;
  locationError: VetSearchErrorCode | null;
  onSearch: (query: string) => void;
  onUseLocation: (lat: number, lon: number) => void;
  onLocationError: (errorCode: VetSearchErrorCode) => void;
};

export function SearchBar({
  isLoading,
  locationError,
  onSearch,
  onUseLocation,
  onLocationError,
}: SearchBarProps) {
  const [query, setQuery] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch(query);
  }

  function handleUseLocation() {
    if (!navigator.geolocation) {
      onLocationError("LOCATION_UNAVAILABLE");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onUseLocation(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          onLocationError("LOCATION_PERMISSION_DENIED");
          return;
        }

        onLocationError("LOCATION_UNAVAILABLE");
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 300000,
      }
    );
  }

  const locationMessage =
    locationError === "LOCATION_PERMISSION_DENIED"
      ? "Location access denied. Try searching by address instead."
      : locationError === "LOCATION_UNAVAILABLE"
        ? "Couldn't get your location. Try searching by address instead."
        : null;

  return (
    <div className="space-y-2">
      <form
        className="flex flex-col gap-2 rounded-xl border border-border/80 bg-card/95 p-2 shadow-lg backdrop-blur sm:flex-row sm:items-end"
        onSubmit={handleSubmit}
      >
        <div className="min-w-0 flex-1">
          <label
            htmlFor="find-vet-query"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            Search by address, city, or clinic name
          </label>
          <Input
            id="find-vet-query"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Manila, Banfield Pet Hospital, 123 Main St"
            className="h-10 bg-background text-sm"
            maxLength={100}
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={isLoading}
            onClick={handleUseLocation}
            className="inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-md px-3 text-sm font-medium text-secondary transition-colors hover:bg-secondary/10 disabled:pointer-events-none disabled:opacity-50 dark:text-secondary-foreground"
          >
            <LocateFixed className="size-4" aria-hidden="true" />
            Use my location
          </button>
          <Button type="submit" size="lg" disabled={isLoading || !query.trim()}>
            <Search aria-hidden="true" />
            Search
          </Button>
        </div>
      </form>
      {locationMessage ? (
        <p className="rounded-lg border border-border/80 bg-card/95 px-3 py-2 text-sm text-muted-foreground shadow-sm">
          {locationMessage}
        </p>
      ) : null}
    </div>
  );
}

