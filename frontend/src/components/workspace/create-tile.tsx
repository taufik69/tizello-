import { PlusIcon } from "@/components/ui/icons";

/**
 * The dashed "add one" tile that closes a card grid. A real `<button>`, so it
 * is tab-reachable and picks up the base layer's focus ring; it is imported
 * only by client leaves, which is what lets it take an `onClick`.
 */
export function CreateTile({
  label,
  description,
  onClick,
}: {
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="hover-lift flex h-full w-full flex-col items-start gap-1 rounded-md border border-dashed border-border-strong p-4 text-left hover:border-brand-500 hover:bg-surface"
    >
      <span className="flex items-center gap-1.5 font-semibold text-text">
        <PlusIcon className="size-3.5" />
        {label}
      </span>
      <span className="text-sm text-text-muted">{description}</span>
    </button>
  );
}
