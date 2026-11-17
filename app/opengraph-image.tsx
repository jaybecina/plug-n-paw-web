import { ogContentType, ogSize, renderOg } from "@/lib/og";
import { siteConfig } from "@/lib/site";

export const alt = "Plug N Paw: free pet health tools";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOg({ title: siteConfig.tagline, kicker: "Free pet health tools" });
}
