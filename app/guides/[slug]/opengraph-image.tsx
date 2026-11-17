import { notFound } from "next/navigation";
import { getGuide, getGuides } from "@/lib/guides";
import { ogContentType, ogSize, renderOg } from "@/lib/og";

export const alt = "Plug N Paw care guide";
export const size = ogSize;
export const contentType = ogContentType;

export function generateStaticParams() {
  return getGuides().map((g) => ({ slug: g.slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();
  return renderOg({ title: guide.title, kicker: `Care guide · ${guide.category}` });
}
