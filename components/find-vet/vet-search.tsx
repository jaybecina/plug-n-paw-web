"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchBar } from "@/components/find-vet/search-bar";
import { VetResults } from "@/components/find-vet/vet-results";
import { useVetSearch } from "@/hooks/use-vet-search";

const VetMap = dynamic(() => import("@/components/find-vet/vet-map"), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-none" />,
});

export function VetSearch() {
  const {
    status,
    data,
    errorCode,
    selectedId,
    searchByQuery,
    searchByLocation,
    select,
    retry,
    setLocationError,
  } = useVetSearch();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [snapPoint, setSnapPoint] = useState<number | string | null>(0.18);
  const [resizeSignal, setResizeSignal] = useState(0);

  const liveMessage = useMemo(() => {
    if (status === "loading") {
      return "Loading veterinary clinics";
    }

    if (status === "error") {
      return "We could not load veterinary clinics";
    }

    if (status === "success" && data) {
      return data.results.length === 1
        ? "1 veterinary clinic found"
        : `${data.results.length} veterinary clinics found`;
    }

    return "";
  }, [data, status]);

  function nudgeMapSize() {
    setResizeSignal((value) => value + 1);
  }

  return (
    <div className="relative h-[calc(100dvh-4rem)] overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0">
        <VetMap
          data={data}
          selectedId={selectedId}
          resizeSignal={resizeSignal}
          onSelect={select}
        />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[1000] mx-auto w-full max-w-5xl p-3 md:right-[25rem] md:max-w-3xl md:p-5">
        <div className="pointer-events-auto">
          <SearchBar
            isLoading={status === "loading"}
            locationError={errorCode}
            onSearch={searchByQuery}
            onUseLocation={searchByLocation}
            onLocationError={setLocationError}
          />
        </div>
      </div>

      {isDesktop ? (
        <aside className="absolute bottom-0 right-0 top-0 z-[900] flex w-[25rem] border-l border-border bg-background/92 pt-32 shadow-2xl backdrop-blur">
          <VetResults
            status={status}
            data={data}
            errorCode={errorCode}
            selectedId={selectedId}
            onSelect={select}
            onRetry={retry}
          />
        </aside>
      ) : null}

      {!isDesktop ? (
        <Drawer
          open
          onOpenChange={(open) => {
            if (!open) {
              setSnapPoint(0.18);
            }
            nudgeMapSize();
          }}
          snapPoints={[0.18, 0.82]}
          snapPoint={snapPoint}
          defaultSnapPoint={0.18}
          onSnapPointChange={(nextSnapPoint) => {
            setSnapPoint(nextSnapPoint);
            nudgeMapSize();
          }}
          modal={false}
          showSwipeHandle
        >
          <DrawerContent className="h-dvh border-border bg-background/96 backdrop-blur">
            <DrawerHeader className="sr-only">
              <DrawerTitle>Veterinary clinics</DrawerTitle>
              <DrawerDescription>
                Search results for nearby veterinary clinics.
              </DrawerDescription>
            </DrawerHeader>
            <VetResults
              status={status}
              data={data}
              errorCode={errorCode}
              selectedId={selectedId}
              onSelect={select}
              onRetry={retry}
            />
          </DrawerContent>
        </Drawer>
      ) : null}

      <p className="sr-only" aria-live="polite">
        {liveMessage}
      </p>
    </div>
  );
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);

    update();
    media.addEventListener("change", update);

    return () => media.removeEventListener("change", update);
  }, [query]);

  return matches;
}
