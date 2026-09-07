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

/**
 * The "more than these eight" trigger beside `WorkspaceAppearancePicker`'s
 * quick-pick row. A real picker rather than a hand-rolled grid — unlike this
 * app's other icons (`ui/icons.tsx`), an emoji set is data, not eight fixed
 * glyphs a designer drew.
 *
 * The panel is `position: fixed`, not `absolute`, so it escapes
 * `CreateWorkspaceDialog`'s `overflow-y-auto` (`ui/dialog.tsx`) instead of
 * being clipped and scrolled inside the dialog. It stays a DOM descendant of
 * the `<dialog>` rather than a `createPortal` to `document.body`: a native
 * dialog shown via `showModal()` paints in the browser's top layer, above
 * the rest of the page regardless of z-index, so anything portaled outside
 * it — including to `document.body` — renders *behind* the dialog's own
 * backdrop instead of above it.
 *
 * **`position: fixed` inside an open `<dialog>` is relative to the dialog,
 * not the viewport** — verified directly (an element styled `top:50px;
 * left:50px` inside the dialog rendered at the dialog's own
 * `getBoundingClientRect()` origin plus 50, not the viewport's). Chromium
 * treats the dialog as the containing block for its fixed descendants. The
 * position below is computed in viewport space (so it can check against
 * `window.innerWidth/Height` for the flip-up/clamp logic below) and then
 * translated into dialog-relative coordinates by subtracting the dialog's
 * own origin — skip that subtraction and the panel renders far from the
 * trigger, offset by wherever the dialog happens to sit on screen.
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
    if (trigger) {
      const rect = trigger.getBoundingClientRect();
      // Flips above the trigger when the picker (360px tall) would otherwise
      // run off the bottom of the viewport — the dialog itself can sit
      // anywhere on screen, unlike a page-level dropdown with room below it.
      const opensUp = rect.bottom + 368 > window.innerHeight;
      const viewportTop = opensUp ? rect.top - 368 : rect.bottom + 4;
      const viewportLeft = Math.min(rect.left, window.innerWidth - 300);

      // Convert to dialog-relative coordinates — see the header comment.
      // `?? { top: 0, left: 0 }` covers this ever being used outside a
      // <dialog>, where fixed positioning behaves normally and no
      // translation is needed.
      const anchor = trigger.closest("dialog")?.getBoundingClientRect() ?? { top: 0, left: 0 };
      setPosition({ top: viewportTop - anchor.top, left: viewportLeft - anchor.left });
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
          role="dialog"
          aria-label="Emoji picker"
          className="fixed z-[60]"
          style={{ top: position.top, left: position.left }}
        >
          <EmojiPicker
            onEmojiClick={pick}
            theme={PICKER_THEME[theme]}
            emojiStyle={EmojiStyle.NATIVE}
            autoFocusSearch={false}
            width={296}
            height={360}
            previewConfig={{ showPreview: false }}
          />
        </div>
      )}
    </>
  );
}
