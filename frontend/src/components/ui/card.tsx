import { cn } from "@/lib/cn";

/*
 * shadcn's Card anatomy, hand-rolled on this codebase's tokens. The prop names
 * and the part names match, so dropping the real shadcn file in later is a
 * replacement rather than a refactor.
 *
 * `cn` does not resolve Tailwind conflicts, so the bases below deliberately
 * omit anything a caller is likely to override — CardTitle sets no font size,
 * Card sets no height. What a base does set, it owns.
 */

export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-md border border-border bg-surface",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1 p-4", className)} {...props} />;
}

/**
 * A real `<h3>`, not a styled `<div>`: these titles sit under a section `<h2>`
 * on both workspace screens, and a card grid that announces no headings is a
 * grid a screen-reader user cannot skim.
 */
export function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return <h3 className={cn("font-semibold text-text", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-sm text-text-muted", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("px-4 pb-4", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("mt-auto flex items-center gap-2 px-4 pb-4", className)}
      {...props}
    />
  );
}
