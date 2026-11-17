import { Info, TriangleAlert } from "lucide-react";
import type { GuideBlock } from "@/content/types";
import { cn } from "@/lib/utils";

export function GuideBody({ blocks }: { blocks: GuideBlock[] }) {
  return (
    <div className="space-y-5 text-lg leading-8">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "h2":
            return (
              <h2
                key={i}
                id={block.id}
                className="scroll-mt-24 pt-6 font-heading text-2xl font-semibold text-secondary sm:text-3xl"
              >
                {block.text}
              </h2>
            );
          case "p":
            return <p key={i}>{block.text}</p>;
          case "ul":
            return (
              <ul key={i} className="list-disc space-y-2 pl-6 marker:text-primary">
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            );
          case "callout": {
            const warning = block.tone === "warning";
            const Icon = warning ? TriangleAlert : Info;
            return (
              <aside
                key={i}
                className={cn(
                  "flex gap-3 rounded-2xl p-5 text-base leading-7",
                  warning ? "bg-sev-urgent text-sev-urgent-fg" : "bg-tint-teal"
                )}
              >
                <Icon className="mt-1 size-5 shrink-0" aria-hidden="true" />
                <p>{block.text}</p>
              </aside>
            );
          }
        }
      })}
    </div>
  );
}
