import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/navbar";
import { SiteFooterGate } from "@/components/site-footer-gate";

export const metadata: Metadata = {
  title: "Plug N Paw",
  description: "Find nearby veterinary clinics with Plug N Paw.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", "font-sans")}
    >
      <body className="min-h-full flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <SiteFooterGate />
      </body>
    </html>
  );
}
