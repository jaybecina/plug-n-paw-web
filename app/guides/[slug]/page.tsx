import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { GuideBody } from "@/components/guides/guide-body";
import { GuideCard } from "@/components/guides/guide-card";
import { JsonLd } from "@/components/json-ld";
import { buttonVariants } from "@/components/ui/button";
import {
  getGuide,
  getGuides,
  getRelatedGuides,
  guideToc,
  readMinutes,
} from "@/lib/guides";
import { siteConfig } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return getGuides().map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/guides/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return {};
  return {
    title: guide.title,
    description: guide.excerpt,
    alternates: { canonical: `/guides/${guide.slug}` },
    openGraph: { type: "article", modifiedTime: guide.updated },
  };
}

export default async function GuidePage({
  params,
}: PageProps<"/guides/[slug]">) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  const toc = guideToc(guide);
  const related = getRelatedGuides(guide, 3);
  const updated = new Date(guide.updated).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  return (
    <article className="container-page py-12 sm:py-16">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: guide.title,
          description: guide.excerpt,
          image: guide.image.src,
          dateModified: guide.updated,
          author: { "@type": "Organization", name: siteConfig.name },
          publisher: { "@type": "Organization", name: siteConfig.name },
        }}
      />
      <Breadcrumbs
        items={[
          { href: "/", label: "Home" },
          { href: "/guides", label: "Guides" },
          { label: guide.title },
        ]}
      />

      <header className="mt-6 max-w-3xl">
        <p className="text-sm font-semibold text-primary">
          {guide.category} · {readMinutes(guide)} min read · Updated {updated}
        </p>
        <h1 className="mt-3 font-heading text-4xl font-semibold leading-tight text-balance text-secondary sm:text-5xl">
          {guide.title}
        </h1>
        <p className="mt-4 text-lg leading-8 text-muted-foreground">{guide.excerpt}</p>
      </header>

      <div className="relative mt-8 aspect-[16/8] overflow-hidden rounded-3xl bg-muted">
        <Image
          src={guide.image.src}
          alt={guide.image.alt}
          fill
          priority
          sizes="(min-width: 1280px) 1200px, 100vw"
          className="object-cover"
        />
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_16rem]">
        <div className="max-w-3xl">
          <GuideBody blocks={guide.body} />
          <p className="mt-10 border-t border-border pt-6 text-sm text-muted-foreground">
            {siteConfig.disclaimer}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/find-vet" className={buttonVariants({ size: "lg", className: "h-11 rounded-full px-5" })}>
              Find a vet near me
            </Link>
            <Link href="/symptom-checker" className="inline-flex h-11 items-center rounded-full border border-border bg-card px-5 text-sm font-medium hover:bg-muted">
              Check a symptom
            </Link>
          </div>
        </div>

        {toc.length > 0 && (
          <aside className="hidden lg:block">
            <nav aria-label="On this page" className="sticky top-24">
              <p className="font-heading text-sm font-semibold text-secondary">On this page</p>
              <ul className="mt-3 space-y-2 border-l border-border pl-4 text-sm">
                {toc.map((h) => (
                  <li key={h.id}>
                    <a href={`#${h.id}`} className="text-muted-foreground hover:text-foreground">
                      {h.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        )}
      </div>

      <section className="mt-16">
        <h2 className="font-heading text-2xl font-semibold text-secondary">More guides</h2>
        <ul className="mt-6 grid gap-5 sm:grid-cols-3">
          {related.map((g) => (
            <li key={g.slug}>
              <GuideCard guide={g} sizes="(min-width: 640px) 33vw, 100vw" />
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
