"use client";

import Link from "next/link";
import { TriangleAlert } from "lucide-react";

export default function ErrorPage({ retry }: { error: Error; retry: () => void }) {
  return (
    <div className="container-page flex min-h-[60dvh] flex-col items-center justify-center py-16 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-sev-urgent text-sev-urgent-fg">
        <TriangleAlert className="size-8" aria-hidden="true" />
      </span>
      <h1 className="mt-6 font-heading text-4xl font-semibold text-secondary">
        Something went wrong
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        Try again. If your pet needs help now, do not wait for this page: call
        your nearest emergency vet.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className="inline-flex h-11 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Try again
        </button>
        <Link href="/emergency" className="inline-flex h-11 items-center rounded-full border border-border bg-card px-5 text-sm font-medium hover:bg-muted">
          Emergency help
        </Link>
      </div>
    </div>
  );
}
