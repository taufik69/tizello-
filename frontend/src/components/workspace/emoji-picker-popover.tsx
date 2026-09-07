"use client";

import EmojiPicker, { EmojiStyle, Theme, type EmojiClickData } from "emoji-picker-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { getThemeServerSnapshot, readStoredTheme, subscribeToTheme } from "@/lib/theme";
import { SmileIcon } from "@/components/workspace/workspace-appearance-icons";

/** "system" has no JS-visible resolved value — `Theme.AUTO` hands that same decision to the picker's own `prefers-color-scheme` check, same as `color-scheme: light dark` does for the rest of the app. */
const PICKER_THEME: Record<string, Theme> = {
  light: Theme.LIGHT,
  dark: Theme.DARK,
  system: Theme.AUTO,
};

/** Passed to `<EmojiPicker>` and used to place it — the panel has no intrinsic size to measure before it is shown. */
const PANEL_WIDTH = 296;
const PANEL_HEIGHT = 360;
const MARGIN = 8;

/**
 * The "more than these eight" trigger beside `WorkspaceAppearancePicker`'s
 * quick-pick row. A real picker rather than a hand-rolled grid — unlike this
 * app's other icons (`ui/icons.tsx`), an emoji set is data, not eight fixed
 * glyphs a designer drew.
 *
 * The panel is a **popover** (`showPopover()`), which is what makes it float
 * free the way a native `<input type="color">` picker does. `position: fixed`
 * alone was not enough: the panel is a DOM descendant of the `<dialog>` (it
 * has to be — a `createPortal` to `document.body` renders *behind* a modal
 * dialog's backdrop, since `showModal()` paints in the top layer above
 * everything regardless of z-index), and inside an open dialog Chromium makes
 * the dialog the containing block for fixed descendants *and* counts them in
 * its scrollable overflow. `ui/dialog.tsx` sets `overflow-y-auto`, which per
 * spec forces the other axis to `auto` too, so the panel dragged a horizontal
 * scrollbar across the modal and got clipped at its edges.
 *
 * A popover is promoted into the top layer itself, so it is laid out against
 * the viewport (plain viewport coordinates below — no dialog-relative
 * translation) and no ancestor's overflow can clip or scroll it. Stacking
 * still works: a popover opened from inside a modal dialog sits above it.
 * `popover="manual"` rather than `"auto"` because light-dismiss would close
 * the panel on the same pointerdown that opened it, and this already has its
 * own outside-click and Escape handling.
 *
 * The UA stylesheet gives popovers their own `position: fixed; inset: 0;
 * margin: auto; border; padding; background` — `inset-auto m-0 border-0 p-0
 * bg-transparent` below strips all of that so the picker's own chrome is the
 * only chrome.
 *
 * `emojiStyle={NATIVE}` renders with the OS's own emoji font: no image
 * sprites to fetch, and it matches how `icon` is rendered everywhere else
 * once chosen (`WorkspaceAvatar` just prints the character).
 */
export function EmojiPickerPopover({ onSelect }: { onSelect: (emoji: string) => void }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const theme = useSyncExternalStore(subscribeToTheme, readStoredTheme, getThemeServerSnapshot);

  useEffect(() => {
    if (!open) return;

    const trigger = triggerRef.current;
    const panel = panelRef.current;
    if (trigger && panel) {
      const rect = trigger.getBoundingClientRect();
      const host = trigger.closest("dialog")?.getBoundingClientRect();

      // Sits *beside* the dialog rather than on top of it — a 360px panel
      // dropped under the trigger covers the colour row and the buttons
      // underneath it, which is the whole form. Right of the dialog by
      // default, left when that would run off-screen, and back to the plain
      // under-the-trigger drop when there is no dialog to sit beside.
      const right = (host?.right ?? rect.right) + MARGIN;
      const left = right + PANEL_WIDTH + MARGIN > window.innerWidth
        ? (host?.left ?? rect.left) - PANEL_WIDTH - MARGIN
        : right;

      // Vertically the panel lines up with the trigger, not the dialog's top:
      // it reads as belonging to the icon row it was opened from.
      const top = host ? rect.top - MARGIN : rect.bottom + 4;

      setPosition({
        top: Math.max(MARGIN, Math.min(top, window.innerHeight - PANEL_HEIGHT - MARGIN)),
        left: Math.max(MARGIN, Math.min(left, window.innerWidth - PANEL_WIDTH - MARGIN)),
      });

      panel.showPopover();
    }

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function pick(data: EmojiClickData) {
    onSelect(data.emoji);
    setOpen(false);
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Choose from all emoji"
        onClick={() => setOpen((value) => !value)}
        className="flex size-8 items-center justify-center rounded-sm border border-border text-text-muted transition-colors duration-100 ease-standard hover:bg-surface-hover hover:text-text"
      >
        <SmileIcon className="size-4" />
      </button>

      {open && (
        <div
          ref={panelRef}
          popover="manual"
          role="dialog"
          aria-label="Emoji picker"
          className="fixed inset-auto m-0 overflow-visible rounded-lg border-0 bg-transparent p-0 shadow-overlay"
          style={{ top: position.top, left: position.left }}
        >
          <EmojiPicker
            onEmojiClick={pick}
            theme={PICKER_THEME[theme]}
            emojiStyle={EmojiStyle.NATIVE}
            autoFocusSearch={false}
            width={PANEL_WIDTH}
            height={PANEL_HEIGHT}
            previewConfig={{ showPreview: false }}
          />
        </div>
      )}
    </>
  );
}
