"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/footer";

const NO_FOOTER_PREFIXES = ["/find-vet"];

export function SiteFooterGate() {
  const pathname = usePathname();
  const hideFooter = NO_FOOTER_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (hideFooter) {
    return null;
  }

  return <Footer />;
}
