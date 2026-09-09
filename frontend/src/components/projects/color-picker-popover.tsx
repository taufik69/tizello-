"use client";

import { useRef, useState } from "react";
import { CheckIcon } from "@/components/ui/icons";
import { useMenuPopover } from "@/components/projects/use-menu-popover";
import { hexToHsv, hsvToHex, normalizeHex, type Hsv } from "@/lib/color";

/**
 * "Any colour", as a panel this app draws — not the OS one.
 *
 * IT REPLACES A NATIVE `<input type="color">`, and that was a real bug rather
 * than a preference. Chromium renders a form control's popup as its own
 * platform window, positioned by the OS and free to extend past the browser's
 * edge; the trigger sits in a right-hand drawer, hard against the right edge of
 * the viewport, so the palette opened half outside the window — off the app
 * entirely on a maximised window, and the part carrying the gradient at that.
 * Nothing in CSS reaches a window the page does not own.
 *
 * A popover does not have that problem: `use-menu-popover.ts` clamps it to the
 * viewport, and the top layer is what keeps it out of the drawer's
 * `overflow-y: auto` (`emoji-picker-popover.tsx` documents the finding).
 *
 * HSV is held here rather than re-derived from `color` on every change, for the
 * reason `lib/color.ts` gives: hue does not survive a round trip through black
 * or grey, so dragging to the bottom of the area and back would come back red.
 * It is re-seeded from the current colour on each open, so a colour set by a
 * preset disc is where the panel starts.
 */
const PANEL_WIDTH = 208;
const PANEL_HEIGHT = 232;

/* The saturation/value plane, painted rather than computed: white → hue left
   to right, transparent → black top to bottom, over the flat hue underneath. */
const PLANE =
  "linear-gradient(to top, #000, rgba(0,0,0,0)), linear-gradient(to right, #fff, rgba(255,255,255,0))";

const HUE_RAIL =
  "linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)";

export function ColorPickerPopover({
  color,
  custom,
  className,
  background,
  onChange,
}: {
  /** The project's colour, or `""`. Only used to seed the panel when it opens. */
  color: string;
  /** Whether the trigger should read as chosen — the caller owns that rule. */
  custom: boolean;
  /** The trigger's classes, so the disc matches the presets beside it. */
  className: string;
  /** The trigger's fill, as a CSS `background` value. A gradient at rest, the chosen hex once there is one — which is the caller's look, not this panel's. */
  background: string;
  onChange: (hex: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [hsv, setHsv] = useState<Hsv>({ h: 145, s: 0.74, v: 0.78 });
  const [text, setText] = useState("#34c77b");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const position = useMenuPopover({
    open,
    triggerRef,
    panelRef,
    height: PANEL_HEIGHT,
    width: PANEL_WIDTH,
    onDismiss: () => setOpen(false),
  });

  function apply(next: Hsv) {
    const hex = hsvToHex(next);
    setHsv(next);
    setText(hex);
    onChange(hex);
  }

  function toggle() {
    if (!open) {
      const seed = hexToHsv(color || "#34c77b");
      setHsv(seed);
      setText(hsvToHex(seed));
    }
    setOpen((value) => !value);
  }

  /* Pointer capture rather than document listeners: the drag must keep tracking
     once the pointer leaves the 176×112 plane, which is most of a real drag. */
  function track(event: React.PointerEvent<HTMLDivElement>) {
    if (event.buttons === 0 && event.type !== "pointerdown") return;

    const rect = event.currentTarget.getBoundingClientRect();
    apply({
      ...hsv,
      s: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
      v: 1 - Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
    });
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Choose a custom colour"
        onClick={toggle}
        className={className}
        style={{ background }}
      >
        {custom && <CheckIcon className="size-3" />}
      </button>

      {open && (
        <div
          ref={panelRef}
          popover="manual"
          role="dialog"
          aria-label="Custom colour"
          /* The UA stylesheet gives popovers `position: fixed; inset: 0;
             margin: auto; border; padding; background` — stripped here so the
             panel's own chrome is the only chrome. */
          className="menu-enter fixed inset-auto m-0 w-52 rounded-md border border-border bg-surface p-2 shadow-overlay"
          style={{ top: position.top, left: position.left }}
        >
          <div
            role="presentation"
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              track(event);
            }}
            onPointerMove={track}
            className="relative h-28 w-full cursor-crosshair overflow-hidden rounded-sm border border-border"
            style={{ background: `${PLANE}, ${hsvToHex({ h: hsv.h, s: 1, v: 1 })}` }}
          >
            {/* Where the current colour sits. White-on-black rings rather than
                a token, for the reason the rainbow disc is not a token either:
                this sits on an arbitrary hue, so it has to read against every
                one of them rather than against a themed surface. */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.45)]"
              style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%` }}
            />
          </div>

          <label className="mt-2 block">
            <span className="sr-only">Hue</span>
            <input
              type="range"
              min={0}
              max={359}
              value={Math.round(hsv.h)}
              onChange={(event) => apply({ ...hsv, h: Number(event.target.value) })}
              /* `appearance-none` hides the UA thumb outright in WebKit and
                 Firefox, so both pseudo-elements have to draw one back — a
                 hue rail with no handle is the bug that looks like a
                 non-functioning slider. */
              className="h-3 w-full cursor-pointer appearance-none rounded-full border border-border [&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-transparent [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-transparent [&::-webkit-slider-thumb]:shadow-[0_0_0_1px_rgba(0,0,0,0.45)]"
              style={{ background: HUE_RAIL }}
            />
          </label>

          <label className="mt-2 flex items-center gap-2">
            <span className="sr-only">Hex</span>
            <span
              aria-hidden="true"
              className="size-5 shrink-0 rounded-full border border-border"
              style={{ backgroundColor: hsvToHex(hsv) }}
            />
            <input
              value={text}
              onChange={(event) => {
                setText(event.target.value);

                /* Applied only once it parses, so the field can be half-typed
                   without the swatch flickering through wrong colours. */
                const hex = normalizeHex(event.target.value);
                if (hex) {
                  setHsv(hexToHsv(hex));
                  onChange(hex);
                }
              }}
              spellCheck={false}
              autoComplete="off"
              maxLength={7}
              aria-label="Hex colour"
              className="h-7 w-full rounded-sm border border-border bg-surface px-2 font-mono text-xs uppercase text-text"
            />
          </label>
        </div>
      )}
    </>
  );
}
