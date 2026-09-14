import Link from "next/link";
import { Menu, X } from "lucide-react";
import { SiteLogo } from "@/components/site-logo";
import { buttonVariants } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

const links = [
  { href: "/", label: "Home" },
  { href: "/find-vet", label: "Find a vet" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur supports-backdrop-filter:bg-background/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 sm:px-10 lg:px-16">
        <SiteLogo />

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/find-vet"
          className={buttonVariants({
            size: "default",
            className: "hidden md:inline-flex",
          })}
        >
          Search for a vet
        </Link>

        <Drawer swipeDirection="right">
          <DrawerTrigger
            className={buttonVariants({
              variant: "ghost",
              size: "icon",
              className: "md:hidden",
            })}
            aria-label="Open menu"
          >
            <Menu />
          </DrawerTrigger>
          <DrawerContent className="flex flex-col gap-6 border-border bg-background p-6">
            <DrawerHeader className="flex flex-row items-center justify-between p-0">
              <SiteLogo />
              <DrawerClose
                className={buttonVariants({ variant: "ghost", size: "icon" })}
                aria-label="Close menu"
              >
                <X />
              </DrawerClose>
            </DrawerHeader>
            <DrawerTitle className="sr-only">Menu</DrawerTitle>
            <DrawerDescription className="sr-only">
              Site navigation links
            </DrawerDescription>

            <nav
              className="flex flex-col gap-1"
              aria-label="Main"
            >
              {links.map((link) => (
                <DrawerClose
                  key={link.href}
                  render={
                    <Link
                      href={link.href}
                      className="rounded-lg px-3 py-2.5 text-base font-medium text-foreground hover:bg-muted"
                    >
                      {link.label}
                    </Link>
                  }
                />
              ))}
            </nav>

            <DrawerClose
              render={
                <Link
                  href="/find-vet"
                  className={buttonVariants({ size: "lg", className: "mt-auto" })}
                >
                  Search for a vet
                </Link>
              }
            />
          </DrawerContent>
        </Drawer>
      </div>
    </header>
  );
}
