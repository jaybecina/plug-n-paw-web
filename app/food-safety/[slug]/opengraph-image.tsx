import { notFound } from "next/navigation";
import { getFood, getFoods } from "@/lib/foods";
import { ogContentType, ogSize, renderOg } from "@/lib/og";

export const alt = "Plug N Paw food safety";
export const size = ogSize;
export const contentType = ogContentType;

export function generateStaticParams() {
  return getFoods().map((f) => ({ slug: f.slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const food = getFood(slug);
  if (!food) notFound();
  return renderOg({
    title: `Can dogs and cats eat ${food.name.toLowerCase()}?`,
    kicker: `Dogs: ${food.dog} · Cats: ${food.cat}`,
  });
}
