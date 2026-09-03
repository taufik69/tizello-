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
 * There is no `AvatarImage`: nothing in this app has a photo to show, and a
 * component that is never rendered is a component that is never tested. Add it
 * (through `AppImage`, never a raw `<img>`) when a real source exists.
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
