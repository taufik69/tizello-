/*
 * Two glyphs used only by the workspace icon chooser — kept out of the shared
 * `ui/icons.tsx` because that file is already at the 150-line cap, the same
 * reason `nav-icons.tsx` lives next door to it rather than in it.
 */
import { Icon, type IconProps } from "@/components/ui/icons";

/** Opens the full emoji picker — the standard "more than these eight" affordance. */
export function SmileIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="8" cy="8" r="6" />
      <path d="M5.75 6.5h.01M10.25 6.5h.01" strokeWidth="2" />
      <path d="M5.5 9.5c.6.8 1.5 1.25 2.5 1.25s1.9-.45 2.5-1.25" />
    </Icon>
  );
}

/** Crossed arrows — "pick one for me" on the icon chooser. */
export function ShuffleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M2.5 5h2.2c.9 0 1.7.45 2.2 1.2l2.2 3.6c.5.75 1.3 1.2 2.2 1.2h2.2" />
      <path d="M11.5 4.5 13.5 6l-2 1.5M11.5 12.5l2-1.5-2-1.5" />
      <path d="M2.5 11h2.2c.9 0 1.7-.45 2.2-1.2l.4-.65" />
    </Icon>
  );
}
