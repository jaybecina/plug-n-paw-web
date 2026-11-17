"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { getHotlineRegion, type HotlineRegion } from "@/lib/hotlines";

const STORAGE_KEY = "pnp-country";
const CHANGE_EVENT = "pnp-country-change";

let detection: Promise<string | null> | null = null;

function detectCountry(): Promise<string | null> {
  detection ??= fetch("/api/country")
    .then((res) => (res.ok ? res.json() : { country: null }))
    .then((data: { country: string | null }) => data.country)
    .catch(() => null);
  return detection;
}

function readStored(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * Picks the hotline region: a country the visitor chose wins, then the
 * country detected from the host's geo header, then the no-number fallback.
 */
export function useHotlineRegion(): {
  region: HotlineRegion;
  choose: (code: string) => void;
  ready: boolean;
} {
  const stored = useSyncExternalStore(subscribe, readStored, () => null);
  const [detected, setDetected] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    detectCountry().then((country) => {
      if (cancelled) return;
      setDetected(country);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const choose = useCallback((code: string) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // Storage can be blocked; the choice then lasts for this page view only.
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return {
    region: getHotlineRegion(stored ?? detected),
    choose,
    ready: ready || stored !== null,
  };
}
