/*
 * The icon and colour palettes, in one place.
 *
 * They used to live inside `workspace-appearance-picker.tsx`, which was fine
 * while the workspace dialog was the only thing choosing an icon. The project
 * drawer now draws Icon and Colour as two SEPARATE rows with their own compact
 * controls, so the constants outlived the component that held them — and a
 * second copy would be two palettes that drift.
 */

/** A quick-pick set, not an exhaustive one — `EmojiPickerPopover` opens the full set. */
export const ICON_CHOICES = ["🚀", "💼", "📁", "🎯", "🛠️", "📊", "🌱", "🎨"] as const;

/** A wider pool than the quick-pick row, for shuffle — picking among only the visible buttons would make "random" indistinguishable from "click one". */
export const RANDOM_ICON_POOL = [
  "🚀", "💼", "📁", "🎯", "🛠️", "📊", "🌱", "🎨", "⚡", "🔥", "💡", "🧩",
  "🏆", "📌", "🗂️", "🧭", "🛰️", "🔭", "🧪", "⚙️", "🌍", "🏗️", "📈", "🎬",
  "🎧", "📚", "🧠", "🐙", "🦉", "🐝", "🌊", "⛰️", "🌙", "☀️", "🍀", "🎲",
];

/** The same six theme-invariant label hues `WorkspaceAvatar`'s `accent` prop uses — new workspaces, new projects and old fixtures read as one palette. */
export const COLOR_CHOICES = [
  { hex: "#4bce97", name: "Green" },
  { hex: "#f5cd47", name: "Yellow" },
  { hex: "#fea362", name: "Orange" },
  { hex: "#f87168", name: "Red" },
  { hex: "#9f8fef", name: "Purple" },
  { hex: "#579dff", name: "Blue" },
] as const;

/** Anything off the palette — the custom picker allows it — falls back to the hex, which is at least true. */
export function colourName(color: string): string {
  if (!color) return "No colour";
  return (
    COLOR_CHOICES.find((choice) => choice.hex === color.toLowerCase())?.name ??
    color.toUpperCase()
  );
}

/** Never returns what is already chosen, so a click always visibly does something. */
export function randomIcon(current: string): string {
  const pool = RANDOM_ICON_POOL.filter((choice) => choice !== current);
  return pool[Math.floor(Math.random() * pool.length)] ?? RANDOM_ICON_POOL[0];
}

export function isCustomColor(color: string): boolean {
  return color !== "" && !COLOR_CHOICES.some((choice) => choice.hex === color);
}
