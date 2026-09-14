import Link from "next/link";
import { MapPin } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-6 py-16 text-foreground">
      <section className="w-full max-w-2xl space-y-6 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <MapPin aria-hidden="true" />
        </div>
        <div className="space-y-3">
          <h1 className="text-4xl font-semibold tracking-normal text-balance">
            Plug N Paw
          </h1>
          <p className="mx-auto max-w-xl text-base leading-7 text-muted-foreground">
            Search nearby veterinary clinics by address, city, clinic name, or
            your current location.
          </p>
        </div>
        <Link className={buttonVariants({ size: "lg" })} href="/find-vet">
          Find a veterinary clinic
        </Link>
      </section>
    </main>
  );
}
