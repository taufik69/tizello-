import { AppImage } from "@/components/ui/app-image";
import { Section } from "./section";

export function Media() {
  return (
    <Section title="Images — always AppImage">
      <div className="flex flex-wrap items-start gap-6 rounded-md border border-border bg-surface p-5">
        <figure className="space-y-2">
          <AppImage
            src="/image-fallback.svg"
            alt="A neutral placeholder tile"
            width={96}
            height={96}
            className="rounded-md border border-border"
          />
          <figcaption className="text-2xs text-text-subtle">
            quality 100 · lazy
          </figcaption>
        </figure>
        <figure className="space-y-2">
          <AppImage
            src="/does-not-exist.png"
            alt="A source that fails to load, showing the fallback"
            width={96}
            height={96}
            className="rounded-md border border-border"
          />
          <figcaption className="text-2xs text-text-subtle">
            broken src &rarr; fallback
          </figcaption>
        </figure>
        <p className="max-w-xs text-xs text-text-muted">
          Raw <code className="font-mono">&lt;img&gt;</code> fails lint. Wrapping
          next/image in one place means no call site has to remember the quality
          allowlist, the lazy default, or the error fallback.
        </p>
      </div>
    </Section>
  );
}
