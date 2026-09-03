import { cn } from "@/lib/cn";

/*
 * shadcn's Table anatomy, hand-rolled on this codebase's tokens — the same
 * bargain `card.tsx` strikes. The part names match, so dropping the real
 * shadcn file in later is a replacement rather than a refactor.
 *
 * `cn` is a plain join, not a conflict-aware merge, so every base below omits
 * what a caller is likely to override: `TableCell` sets no width and no text
 * colour, `TableRow` sets no fill. What a base does set, it owns.
 */

/**
 * The scroll container is part of the primitive, not the caller's problem. An
 * eight-column table on a 360px screen has to scroll SOMEWHERE, and if it is
 * not here it is the document — which takes the sidebar, the header and every
 * other column of the page sideways with it.
 *
 * `w-full` on the wrapper and `min-w-max` on the table together mean: fill the
 * space when the columns fit, scroll inside these bounds when they do not.
 */
export function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div className="w-full overflow-x-auto">
      <table
        className={cn(
          "w-full min-w-max border-collapse text-left text-sm",
          className,
        )}
        {...props}
      />
    </div>
  );
}

export function TableHeader({
  className,
  ...props
}: React.ComponentProps<"thead">) {
  return (
    <thead className={cn("border-b border-border", className)} {...props} />
  );
}

export function TableBody({
  className,
  ...props
}: React.ComponentProps<"tbody">) {
  return <tbody className={className} {...props} />;
}

export function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      className={cn(
        "border-b border-border transition-colors duration-100 ease-standard",
        className,
      )}
      {...props}
    />
  );
}

/**
 * A real `<th>`. Column headers that are `<td>` leave a screen-reader user
 * reading eight unlabelled values per row; `scope` is what makes the
 * association, so it is required rather than defaulted away.
 */
export function TableHead({
  className,
  scope = "col",
  ...props
}: React.ComponentProps<"th">) {
  return (
    <th
      scope={scope}
      className={cn(
        "px-2 py-1.5 align-middle text-2xs font-medium whitespace-nowrap text-text-subtle",
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td className={cn("px-2 py-2 align-middle", className)} {...props} />
  );
}
