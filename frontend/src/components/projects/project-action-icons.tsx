import { Icon, type IconProps } from "@/components/ui/icons";

/*
 * The three glyphs the project actions menu draws that the app's own icon set
 * does not already have. A separate file rather than entries in
 * `ui/icons.tsx`, on the same reasoning as `property-icons.tsx`: these are
 * decoration for one menu, not part of the shared set — and Edit and Delete
 * still come from `ui/icons.tsx`, because a pencil and a bin are.
 *
 * Same 16px grid and 1.5 stroke as everything else, through the shared `Icon`
 * wrapper, so they line up with `PencilIcon` and `TrashIcon` beside them.
 */
export function OpenIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9.5 2.5H13.5V6.5M13.5 2.5L8 8" />
      <path d="M12 9.5v2A2 2 0 0110 13.5H4.5a2 2 0 01-2-2V6a2 2 0 012-2h2" />
    </Icon>
  );
}

export function ArchiveIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="2" y="2.5" width="12" height="3.5" rx="1" />
      <path d="M3.25 6v5.5a2 2 0 002 2h5.5a2 2 0 002-2V6" />
      <path d="M6.5 8.75h3" />
    </Icon>
  );
}

/** The archive box with the contents coming back out — the same shape, so the two read as one toggle. */
export function RestoreIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="2" y="2.5" width="12" height="3.5" rx="1" />
      <path d="M3.25 6v5.5a2 2 0 002 2h5.5a2 2 0 002-2V6" />
      <path d="M8 11.75V8M6.5 9.5L8 8l1.5 1.5" />
    </Icon>
  );
}
