import type { MetadataRoute } from "next";
import { getFoods } from "@/lib/foods";
import { getGuides } from "@/lib/guides";
import { siteConfig } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url;
  const staticRoutes = [
    "",
    "/find-vet",
    "/symptom-checker",
    "/food-safety",
    "/guides",
    "/emergency",
    "/plus",
    "/about",
  ];

  return [
    ...staticRoutes.map((path) => ({
      url: `${base}${path}`,
      priority: path === "" ? 1 : 0.8,
    })),
    ...getFoods().map((food) => ({
      url: `${base}/food-safety/${food.slug}`,
      priority: 0.6,
    })),
    ...getGuides().map((guide) => ({
      url: `${base}/guides/${guide.slug}`,
      lastModified: new Date(guide.updated),
      priority: 0.7,
    })),
  ];
}
