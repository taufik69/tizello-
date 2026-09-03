import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/initials";
import type { WorkspaceAccent } from "@/types/workspace";

/* Complete class strings, never `bg-label-${accent}`. The six label hues are
   theme-invariant primitives, so the disc looks the same in both themes;
   `text-on-brand` is the only dark ink that is also theme-invariant, which is
   what makes it the right pairing here rather than a `text-*` semantic. */
const ACCENT: Record<WorkspaceAccent, string> = {
  green: "bg-label-green text-on-brand",
  yellow: "bg-label-yellow text-on-brand",
  orange: "bg-label-orange text-on-brand",
  red: "bg-label-red text-on-brand",
  purple: "bg-label-purple text-on-brand",
  blue: "bg-label-blue text-on-brand",
};

/* 9px initials in a 20px disc matches `MemberAvatars`. */
const SIZE = {
  sm: { root: "size-5", text: "text-[0.5625rem]" },
  default: { root: "size-8", text: "text-xs" },
} as const;

/**
 * The workspace's identity disc.
 *
 * Decorative by default — unlike `MemberAvatars`, the name is always rendered
 * next to it, so an `sr-only` copy would announce the workspace twice. Pass
 * `label` on the rare occasion the disc stands alone.
 */
export function WorkspaceAvatar({
  name,
  accent,
  size = "default",
  label,
  className,
}: {
  name: string;
  accent: WorkspaceAccent;
  size?: keyof typeof SIZE;
  label?: string;
  className?: string;
}) {
  return (
    <Avatar
      className={cn(SIZE[size].root, className)}
      aria-hidden={label ? undefined : true}
    >
      <AvatarFallback className={cn(SIZE[size].text, ACCENT[accent])}>
        <span aria-hidden="true">{initials(name)}</span>
        {label && <span className="sr-only">{label}</span>}
      </AvatarFallback>
    </Avatar>
  );
}
