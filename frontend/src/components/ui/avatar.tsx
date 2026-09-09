import { AppImage } from "@/components/ui/app-image";
import { cn } from "@/lib/cn";

/*
 * An initials disc. Same treatment as `board/member-avatars.tsx` — circle,
 * semibold initials, no image — kept generic here because two features now
 * need it.
 *
 * Neither part sets a size or a font size. `cn` is a plain join, not a
 * conflict-aware merge, so a base that set `size-8` would leave `size-8 size-5`
 * in the class list and let the stylesheet's order pick the winner. The caller
 * passes exactly one of each instead.
 *
 * `AvatarImage` exists now that a real source does — a profile photo, stored by
 * `POST /api/v1/uploads` and served from the public `/static` mount. It goes
 * through `AppImage` like every other image in this app, so a deleted or
 * unreachable file falls back rather than showing a broken tile.
 *
 * It renders ON TOP of the fallback rather than instead of it: the parent's
 * `overflow-hidden rounded-full` clips the photo to the disc, and the initials
 * underneath are what shows while the image loads and if it never does.
 */
export function Avatar({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn("relative flex shrink-0 overflow-hidden rounded-full", className)}
      {...props}
    />
  );
}

export function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "flex size-full items-center justify-center font-semibold",
        className,
      )}
      {...props}
    />
  );
}

/**
 * The photo layer. `fill` rather than fixed dimensions, because the disc's size
 * is the caller's choice (`size-7` in the account menu, `size-20` on the
 * profile page) and an image that has to be told its pixels twice will
 * eventually be told two different things.
 *
 * `sizes` is required with `fill` — without it the browser downloads the
 * largest candidate for a 28px disc. These are never large: the biggest one
 * rendered is 80px, so 96px covers a 2x screen.
 *
 * `unoptimized` for the same reason `FilePreview` uses it: these are served by
 * the API's `/static` mount, which in development is `localhost:5001`, and
 * next/image's optimiser refuses loopback and private hosts as an SSRF guard —
 * a `remotePatterns` entry for one is accepted by the config and then rejected
 * at request time. `next.config.ts` records the bisect. At avatar sizes the
 * resize being given up is worth nothing anyway.
 */
export function AvatarImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <AppImage
      src={src}
      alt={alt}
      fill
      unoptimized
      sizes="96px"
      className={cn("absolute inset-0 object-cover", className)}
    />
  );
}
