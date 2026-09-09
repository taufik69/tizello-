"use client";

import { useCallback, useId, useRef, useState } from "react";
import { CalendarPanel } from "@/components/ui/calendar-panel";
import {
  PANEL_WIDTH,
  usePopoverPosition,
} from "@/components/ui/use-popover-position";
import { formatPickerDate, parseIsoDate } from "@/lib/calendar";
import { cn } from "@/lib/cn";

/**
 * A date field with its own calendar, replacing `TextField type="date"`.
 *
 * The native picker was correct and unstyleable — its popup is UA chrome, so it
 * ignores the theme, the radii and the brand entirely, and it looks like a
 * different application every time it opens.
 *
 * THE VALUE IS ALWAYS `YYYY-MM-DD`, never a `Date`. A `Date` carries a time and
 * a zone, and a picker that stores one turns "8 Sep" into "7 Sep, 23:00" for
 * anybody west of UTC. The button shows `formatPickerDate`'s "Sep 8, 2026";
 * what leaves is the ISO string the API takes.
 *
 * The panel is a **popover** (`showPopover()`), not an absolutely-positioned
 * div, because these fields live inside `ui/dialog.tsx`'s `<dialog>`: a
 * `createPortal` to `document.body` renders BEHIND a modal's backdrop, and a
 * `position: fixed` descendant of an open dialog is clipped by that dialog's
 * `overflow-y: auto`. A popover is promoted into the top layer itself, so no
 * ancestor's overflow can reach it. `EmojiPickerPopover` documents the same
 * finding at length. `popover="manual"` rather than `"auto"` because
 * light-dismiss would close the panel on the same pointerdown that opened it.
 *
 * `today` is a prop, never a clock read here — `lib/calendar.ts` explains why.
 */

export function DateField({
  label,
  value,
  today,
  helper,
  error,
  placeholder = "Empty",
  ghost,
  hideLabel,
  onChange,
}: {
  label: string;
  /** `YYYY-MM-DD`, or "" when unset. */
  value: string;
  /** `YYYY-MM-DD`. */
  today: string;
  helper?: string;
  error?: string;
  placeholder?: string;
  /** The property-row look — see `ui/text-field.tsx`. */
  ghost?: boolean;
  /** Drops the visible label, keeping it as the accessible name, for a field inside a `PropertyRow`. */
  hideLabel?: boolean;
  onChange: (value: string) => void;
}) {
  const id = useId();
  const messageId = `${id}-message`;
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  /* The month on screen. Seeded from the value when there is one and from
     `today` when there is not, so opening an empty field lands on this month
     rather than on January of year zero. */
  const seed = parseIsoDate(value) ?? parseIsoDate(today);
  const [month, setMonth] = useState({
    year: seed?.year ?? 2026,
    month: seed?.month ?? 0,
  });

  /* Focus goes back to the trigger on every close, not just on Escape: a
     panel dismissed by an outside click otherwise leaves focus on `<body>`. */
  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  const position = usePopoverPosition({ open, triggerRef, panelRef, onDismiss: close });

  function openPanel() {
    /* Re-seeded on every open, not just on mount: a field cleared and reopened
       has to land on today again, and one whose value changed elsewhere has to
       land on the new value's month. */
    const next = parseIsoDate(value) ?? parseIsoDate(today);
    if (next) setMonth({ year: next.year, month: next.month });
    setOpen(true);
  }

  const message = error ?? helper;

  return (
    <div>
      <label
        htmlFor={id}
        className={
          hideLabel ? "sr-only" : "block text-xs font-semibold text-text-muted"
        }
      >
        {label}
      </label>

      <button
        id={id}
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-describedby={message ? messageId : undefined}
        onClick={openPanel}
        className={cn(
          "h-9 w-full rounded-sm border px-2.5 text-left text-sm transition-colors duration-100 ease-standard",
          hideLabel ? "" : "mt-1",
          error
            ? "border-danger focus-visible:outline-none"
            : ghost
              ? "border-transparent bg-transparent hover:bg-surface-hover"
              : "border-border bg-surface",
          value ? "text-text" : "text-text-subtle",
        )}
      >
        {formatPickerDate(value) || placeholder}
      </button>

      {message && (
        <p
          id={messageId}
          className={cn("mt-1 text-2xs", error ? "text-danger" : "text-text-subtle")}
        >
          {message}
        </p>
      )}

      {open && (
        <div
          ref={panelRef}
          popover="manual"
          role="dialog"
          aria-label={label}
          /* The UA stylesheet gives popovers `position: fixed; inset: 0;
             margin: auto; border; padding; background` — stripped here so the
             panel's own chrome is the only chrome. */
          className="fixed inset-auto m-0 rounded-lg border border-border bg-surface p-3 shadow-overlay"
          style={{ top: position.top, left: position.left, width: PANEL_WIDTH }}
        >
          <CalendarPanel
            year={month.year}
            month={month.month}
            selected={value}
            today={today}
            onMonthChange={setMonth}
            onSelect={(iso) => {
              onChange(iso);
              close();
            }}
          />

          {/* Clear, and nothing else. Notion's panel also carries End date,
              Date format, Include time and Remind — none of which this model
              has: `startDate` and `endDate` are two separate fields on the
              project, the API stores no time, and there are no reminders.
              Drawing those rows would be four controls that do nothing. */}
          <div className="mt-3 border-t border-border pt-2">
            <button
              type="button"
              onClick={() => {
                onChange("");
                close();
              }}
              className="w-full rounded-sm px-2 py-1.5 text-left text-xs text-text-muted transition-colors duration-100 ease-standard hover:bg-surface-hover hover:text-text"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
