"use client";

import { CheckIcon } from "@/components/ui/icons";
import { EmojiPickerPopover } from "@/components/workspace/emoji-picker-popover";
import { ShuffleIcon } from "@/components/workspace/workspace-appearance-icons";

/** A quick-pick set, not an exhaustive one — `EmojiPickerPopover` beside it opens the full set. */
const ICON_CHOICES = ["🚀", "💼", "📁", "🎯", "🛠️", "📊", "🌱", "🎨"];

/** A wider pool than the row above, for the shuffle button — picking among only the eight visible buttons would make "random" indistinguishable from "click one". */
const RANDOM_ICON_POOL = [
  "🚀", "💼", "📁", "🎯", "🛠️", "📊", "🌱", "🎨", "⚡", "🔥", "💡", "🧩",
  "🏆", "📌", "🗂️", "🧭", "🛰️", "🔭", "🧪", "⚙️", "🌍", "🏗️", "📈", "🎬",
  "🎧", "📚", "🧠", "🐙", "🦉", "🐝", "🌊", "⛰️", "🌙", "☀️", "🍀", "🎲",
];

/** The same six theme-invariant label hues `WorkspaceAvatar`'s `accent` prop already uses — new workspaces and old fixtures read as one palette. */
const COLOR_CHOICES = [
  { hex: "#4bce97", name: "Green" },
  { hex: "#f5cd47", name: "Yellow" },
  { hex: "#fea362", name: "Orange" },
  { hex: "#f87168", name: "Red" },
  { hex: "#9f8fef", name: "Purple" },
  { hex: "#579dff", name: "Blue" },
] as const;

/**
 * The icon + colour choosers for `CreateWorkspaceDialog`, split out only to
 * clear the 150-line cap — both are pure controlled inputs with no state of
 * their own. Clicking the already-selected option clears it, which is the
 * only way to get back to "no icon" / "no colour" once one is picked.
 */
export function WorkspaceAppearancePicker({
  icon,
  color,
  onIconChange,
  onColorChange,
}: {
  icon: string;
  color: string;
  onIconChange: (icon: string) => void;
  onColorChange: (color: string) => void;
}) {
  function randomIcon() {
    const pool = RANDOM_ICON_POOL.filter((choice) => choice !== icon);
    onIconChange(pool[Math.floor(Math.random() * pool.length)] ?? RANDOM_ICON_POOL[0]);
  }

  return (
    <>
      <fieldset className="mt-5">
        <legend className="text-xs font-semibold text-text-muted">Icon</legend>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {ICON_CHOICES.map((choice) => (
            <button
              key={choice}
              type="button"
              aria-pressed={icon === choice}
              onClick={() => onIconChange(icon === choice ? "" : choice)}
              className={[
                "flex size-8 items-center justify-center rounded-sm border text-base transition-colors duration-100 ease-standard",
                icon === choice
                  ? "border-focus bg-surface-hover ring-2 ring-focus"
                  : "border-border hover:bg-surface-hover",
              ].join(" ")}
            >
              {choice}
            </button>
          ))}

          <span className="mx-0.5 h-6 w-px bg-border" aria-hidden="true" />

          <EmojiPickerPopover onSelect={onIconChange} />

          <button
            type="button"
            aria-label="Pick a random icon"
            onClick={randomIcon}
            className="flex size-8 items-center justify-center rounded-sm border border-border text-text-muted transition-colors duration-100 ease-standard hover:bg-surface-hover hover:text-text"
          >
            <ShuffleIcon className="size-4" />
          </button>
        </div>
      </fieldset>

      <fieldset className="mt-4">
        <legend className="text-xs font-semibold text-text-muted">Colour</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {COLOR_CHOICES.map((choice) => (
            <button
              key={choice.hex}
              type="button"
              aria-pressed={color === choice.hex}
              aria-label={choice.name}
              onClick={() => onColorChange(color === choice.hex ? "" : choice.hex)}
              className="flex size-7 items-center justify-center rounded-full text-on-brand transition-transform duration-100 ease-standard hover:scale-110"
              style={{ backgroundColor: choice.hex }}
            >
              {color === choice.hex && <CheckIcon className="size-3.5" />}
            </button>
          ))}
        </div>
      </fieldset>
    </>
  );
}
