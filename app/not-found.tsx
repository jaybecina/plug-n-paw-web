import Link from "next/link";
import { PawPrint } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60dvh] flex-col items-center justify-center py-16 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-tint-clay text-primary">
        <PawPrint className="size-8" aria-hidden="true" />
      </span>
      <h1 className="mt-6 font-heading text-4xl font-semibold text-secondary">
        We could not find that page
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        The link may be old or mistyped. Try one of these instead.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className={buttonVariants({ size: "lg", className: "h-11 rounded-full px-5" })}>
          Go home
        </Link>
        <Link href="/find-vet" className="inline-flex h-11 items-center rounded-full border border-border bg-card px-5 text-sm font-medium hover:bg-muted">
          Find a vet
        </Link>
        <Link href="/emergency" className="inline-flex h-11 items-center rounded-full bg-sev-emergency/10 px-5 text-sm font-medium text-sev-emergency hover:bg-sev-emergency/20">
          Emergency help
        </Link>
      </div>
    </div>
  );
}
