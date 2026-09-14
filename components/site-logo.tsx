import Link from "next/link";
import { PawPrint } from "lucide-react";
import { cn } from "@/lib/utils";

export function SiteLogo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "group/logo inline-flex items-center gap-2.5 shrink-0",
        className
      )}
    >
      <span className="brand-mark" aria-hidden="true">
        <PawPrint className="size-3.5" strokeWidth={2.25} />
      </span>
      <span className="font-heading text-lg font-semibold tracking-tight">
        Plug N Paw
      </span>
    </Link>
  );
}
