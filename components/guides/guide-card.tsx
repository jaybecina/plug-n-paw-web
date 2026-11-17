import Image from "next/image";
import Link from "next/link";
import type { Guide } from "@/content/types";
import { readMinutes } from "@/lib/guides";

export function GuideCard({ guide, sizes }: { guide: Guide; sizes?: string }) {
  return (
    <Link
      href={`/guides/${guide.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card transition-shadow hover:shadow-(--shadow-lift) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <Image
          src={guide.image.src}
          alt={guide.image.alt}
          fill
          sizes={sizes ?? "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"}
          className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold text-primary">
          {guide.category} · {readMinutes(guide)} min read
        </p>
        <h3 className="mt-2 font-heading text-lg font-semibold leading-snug text-secondary">
          {guide.title}
        </h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {guide.excerpt}
        </p>
      </div>
    </Link>
  );
}
