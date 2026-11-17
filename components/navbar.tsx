import Link from "next/link";
import { Menu, X } from "lucide-react";
import { SiteLogo } from "@/components/site-logo";
import { NavLink } from "@/components/nav-link";
import { siteConfig } from "@/lib/site";
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

const links = siteConfig.nav;

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur supports-backdrop-filter:bg-background/70">
      <div className="flex h-16 container-page items-center justify-between">
        <SiteLogo />

        <nav className="hidden items-center gap-6 lg:flex" aria-label="Main">
          {links.map((link) => (
            <NavLink key={link.href} item={link} />
          ))}
        </nav>

        <Link
          href="/find-vet"
          className={buttonVariants({
            size: "default",
            className: "hidden lg:inline-flex",
          })}
        >
          Find a vet
        </Link>

        <Drawer swipeDirection="right">
          <DrawerTrigger
            className={buttonVariants({
              variant: "ghost",
              size: "icon",
              className: "lg:hidden",
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
                      className={
                        link.emphasis === "emergency"
                          ? "rounded-lg bg-sev-emergency/10 px-3 py-2.5 text-base font-medium text-sev-emergency"
                          : "rounded-lg px-3 py-2.5 text-base font-medium text-foreground hover:bg-muted"
                      }
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
                  Find a vet near me
                </Link>
              }
            />
          </DrawerContent>
        </Drawer>
      </div>
    </header>
  );
}
