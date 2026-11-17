"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Siren } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/lib/site";

export function NavLink({
  item,
  className,
}: {
  item: NavItem;
  className?: string;
}) {
  const pathname = usePathname();
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const emergency = item.emphasis === "emergency";

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        emergency
          ? "bg-sev-emergency/10 px-3 py-1.5 text-sev-emergency hover:bg-sev-emergency/20"
          : active
            ? "px-1 py-1.5 text-foreground underline decoration-primary decoration-2 underline-offset-8"
            : "px-1 py-1.5 text-muted-foreground hover:text-foreground",
        className
      )}
    >
      {emergency && <Siren className="size-4" aria-hidden="true" />}
      {item.label}
    </Link>
  );
}
