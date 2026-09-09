"use client";

import { CheckIcon } from "@/components/ui/icons";
import { ColorPickerPopover } from "@/components/projects/color-picker-popover";
import {
  COLOR_CHOICES,
  colourName,
  isCustomColor,
} from "@/components/workspace/appearance-choices";

/**
 * The Colour row — the swatch alone, with no emoji control anywhere in it.
 *
 * Six discs, a conic "any colour" disc and a slashed "no colour" disc, all on
 * one line. Inline rather than behind a popover for the reason
 * `IconRowControl` documents: the pair only needed a panel while they were one
 * row, and a single row of eight 24px discs is shorter than the 36px control
 * it replaces.
 *
 * The "no colour" disc is a real option rather than a click-again-to-clear,
 * because a colour has no glyph to re-click — the selected disc looks the same
 * whether clicking it would set or clear it, which is exactly the ambiguity
 * the icon row avoids by showing the emoji itself.
 */
const DISC =
  "relative flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full text-on-brand transition-transform duration-100 ease-standard hover:scale-110";

const RAINBOW =
  "conic-gradient(from 180deg, #f87168, #f5cd47, #4bce97, #579dff, #9f8fef, #f87168)";

export function ColorRowControl({
  color,
  onChange,
}: {
  color: string;
  onChange: (color: string) => void;
}) {
  const custom = isCustomColor(color);

  return (
    <div className="flex min-h-9 flex-wrap items-center gap-2 rounded-sm border border-transparent px-1.5 py-1 transition-colors duration-100 ease-standard hover:bg-surface-hover">
      <button
        type="button"
        aria-pressed={color === ""}
        aria-label="No colour"
        onClick={() => onChange("")}
        className="grid size-6 shrink-0 place-items-center rounded-full border border-border-strong text-text-subtle transition-transform duration-100 ease-standard hover:scale-110"
      >
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="size-3.5" aria-hidden="true">
          <path d="M3.5 12.5l9-9" />
        </svg>
      </button>

      {COLOR_CHOICES.map((choice) => (
        <button
          key={choice.hex}
          type="button"
          aria-pressed={color === choice.hex}
          aria-label={choice.name}
          onClick={() => onChange(choice.hex)}
          className={DISC}
          style={{ backgroundColor: choice.hex }}
        >
          {color === choice.hex && <CheckIcon className="size-3" />}
        </button>
      ))}

      {/*
       * The one swatch whose fill isn't a design token on purpose: a conic
       * rainbow is the standard "pick any colour" affordance, and once a
       * custom colour is chosen the disc shows that literal hex back.
       *
       * It used to open a native `<input type="color">`, which Chromium hands
       * to the OS as its own window — and an OS window anchored to a control
       * pinned against the right edge of the screen opened half outside the
       * browser. `ColorPickerPopover` is the same choice in a panel this app
       * places, and can therefore keep on screen.
       *
       * The fill is passed in rather than owned by the picker: the rainbow and
       * the chosen-hex swap are this row's look, and the panel is reusable.
       */}
      <ColorPickerPopover
        color={color}
        custom={custom}
        className={DISC}
        background={custom ? color : RAINBOW}
        onChange={onChange}
      />

      <span className="ml-auto pr-1 text-xs text-text-subtle">
        {colourName(color)}
      </span>
    </div>
  );
}
