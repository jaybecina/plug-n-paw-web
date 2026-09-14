import Link from "next/link";
import { Navigation, Phone } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-dvh items-center bg-background px-6 py-16 text-foreground sm:px-10 lg:px-16">
      <div className="mx-auto grid w-full max-w-5xl items-center gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
        <section className="max-w-md">
          <h1 className="font-heading text-4xl font-semibold leading-tight text-balance sm:text-5xl">
            Find a vet nearby, right now.
          </h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Search by address, city, or clinic name — or share your location
            and see what&apos;s closest, mapped and ranked by distance.
          </p>
          <Link
            className={buttonVariants({ size: "lg", className: "mt-7" })}
            href="/find-vet"
          >
            Search for a vet near you
          </Link>
        </section>

        <section aria-hidden="true" className="relative mx-auto w-full max-w-sm">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-secondary/6 p-6">
            <svg
              viewBox="0 0 320 260"
              className="h-56 w-full text-secondary/25"
              fill="none"
            >
              <path
                d="M10 210 C 70 180, 90 120, 150 100 S 260 60, 300 20"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray="2 10"
                strokeLinecap="round"
              />
              <path
                d="M30 40 C 90 70, 120 130, 90 190 S 200 230, 290 190"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray="2 10"
                strokeLinecap="round"
              />
            </svg>

            <Pin className="absolute left-[18%] top-[22%]" rank={1} />
            <Pin className="absolute left-[52%] top-[46%]" rank={2} selected />
            <Pin className="absolute left-[74%] top-[16%]" rank={3} />
          </div>

          <div className="absolute -bottom-5 left-1/2 w-[85%] -translate-x-1/2 rounded-lg border border-border bg-card p-3 shadow-lg">
            <p className="truncate text-sm font-medium">
              Paw Print Veterinary Clinic
            </p>
            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Phone className="size-3" /> Open in Maps
              </span>
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Navigation className="size-3" /> 0.7 km
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Pin({
  rank,
  selected,
  className,
}: {
  rank: number;
  selected?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`vet-marker ${selected ? "vet-marker-selected" : ""} ${className ?? ""}`}
    >
      <span>{rank}</span>
    </span>
  );
}
