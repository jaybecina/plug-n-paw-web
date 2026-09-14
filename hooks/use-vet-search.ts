"use client";

import { useCallback, useMemo, useState } from "react";
import type { SearchResponse } from "@/lib/vets/types";

export type VetSearchErrorCode =
  | "SEARCH_FAILED"
  | "LOCATION_PERMISSION_DENIED"
  | "LOCATION_UNAVAILABLE";

type LastSearch =
  | { type: "query"; q: string }
  | { type: "location"; lat: number; lon: number };

export function useVetSearch() {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [data, setData] = useState<SearchResponse | null>(null);
  const [errorCode, setErrorCode] = useState<VetSearchErrorCode | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lastSearch, setLastSearch] = useState<LastSearch | null>(null);

  const runSearch = useCallback(async (search: LastSearch) => {
    const params = new URLSearchParams();

    if (search.type === "query") {
      params.set("q", search.q);
    } else {
      params.set("lat", String(search.lat));
      params.set("lon", String(search.lon));
    }

    setStatus("loading");
    setErrorCode(null);
    setLastSearch(search);

    try {
      const response = await fetch(`/api/vets/search?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const nextData = (await response.json()) as SearchResponse;
      setData(nextData);
      setSelectedId(nextData.results[0]?.id ?? null);
      setStatus("success");
    } catch {
      setErrorCode("SEARCH_FAILED");
      setStatus("error");
    }
  }, []);

  const searchByQuery = useCallback(
    (q: string) => {
      const trimmed = q.trim();

      if (!trimmed) {
        return;
      }

      return runSearch({ type: "query", q: trimmed });
    },
    [runSearch]
  );

  const searchByLocation = useCallback(
    (lat: number, lon: number) => runSearch({ type: "location", lat, lon }),
    [runSearch]
  );

  const retry = useCallback(() => {
    if (lastSearch) {
      return runSearch(lastSearch);
    }
  }, [lastSearch, runSearch]);

  const actions = useMemo(
    () => ({
      searchByQuery,
      searchByLocation,
      select: setSelectedId,
      retry,
      setLocationError: setErrorCode,
    }),
    [retry, searchByLocation, searchByQuery]
  );

  return {
    status,
    data,
    errorCode,
    selectedId,
    lastSearch,
    ...actions,
  };
}

