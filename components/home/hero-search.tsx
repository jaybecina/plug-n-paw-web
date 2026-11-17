"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LocateFixed, Search } from "lucide-react";

export function HeroSearch({ id = "hero-search" }: { id?: string }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const trimmed = value.trim();

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!trimmed) return;
    router.push(`/find-vet?q=${encodeURIComponent(trimmed.slice(0, 100))}`);
  }

  return (
    <div>
      <form
        onSubmit={onSubmit}
        role="search"
        className="flex w-full max-w-xl items-center gap-2 rounded-full border border-border bg-card p-1.5 shadow-(--shadow-soft) focus-within:ring-3 focus-within:ring-ring/40"
      >
        <label htmlFor={id} className="sr-only">
          City, address or clinic name
        </label>
        <Search
          className="ml-3 size-5 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          id={id}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={100}
          placeholder="City, address or clinic name"
          className="min-w-0 flex-1 bg-transparent py-2.5 text-base outline-none placeholder:text-muted-foreground"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={!trimmed}
          className="shrink-0 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50"
        >
          Find a vet
        </button>
      </form>
      <Link
        href="/find-vet?locate=1"
        className="mt-3 inline-flex items-center gap-2 rounded-md text-sm font-medium text-secondary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <LocateFixed className="size-4" aria-hidden="true" />
        Or use my current location
      </Link>
    </div>
  );
}
