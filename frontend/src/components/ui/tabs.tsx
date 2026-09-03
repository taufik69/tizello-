"use client";

import { useRef } from "react";

/*
 * A real tab widget: `tablist` / `tab` / `tabpanel`, `aria-selected`, the
 * `aria-controls` ↔ `aria-labelledby` pair, a roving tabindex, and
 * Left / Right / Home / End with wraparound.
 *
 * The chrome is `ThemeToggle`'s, deliberately — same bordered trough, same
 * segment sizing, same "one real `<button>` per option" shape. A second way to
 * draw a segmented control would be a second thing to keep in sync.
 *
 * Selection follows focus (automatic activation), which is the APG default
 * when the panels are already in the tree: nothing loads on arrow-key, so
 * making the user press Enter as well would only add a step.
 *
 * `group` namespaces the ids so two tab sets on one page cannot collide.
 * Interpolating an *id* is fine; interpolating a *class name* is not, and none
 * of the class strings below are built.
 */

export type TabDescriptor = { value: string; label: string; count: number };

export function tabId(group: string, value: string): string {
  return `${group}-tab-${value}`;
}

export function tabPanelId(group: string, value: string): string {
  return `${group}-panel-${value}`;
}

const LIST =
  "inline-flex items-center gap-0.5 rounded-sm border border-border bg-surface p-0.5";

const TAB_SELECTED =
  "inline-flex items-center gap-1.5 rounded-xs bg-brand-500 px-2.5 py-1 text-xs font-semibold text-on-brand";
const TAB_IDLE =
  "inline-flex items-center gap-1.5 rounded-xs px-2.5 py-1 text-xs font-medium text-text-muted transition-colors duration-100 ease-standard hover:bg-surface-hover hover:text-text";

/* The count sits a weight below its label so the two read as one chip rather
   than two words. `tabular-nums` keeps the trough from twitching as a count
   crosses from 9 to 10. */
const COUNT_SELECTED = "text-2xs font-normal tabular-nums text-on-brand";
const COUNT_IDLE = "text-2xs font-normal tabular-nums text-text-subtle";

export function TabList({
  group,
  label,
  tabs,
  value,
  onValueChange,
}: {
  /** Namespaces this widget's ids. Must match the `TabPanel`s it controls. */
  group: string;
  /** Names the tablist itself — screen readers announce it before the tabs. */
  label: string;
  tabs: TabDescriptor[];
  value: string;
  onValueChange: (value: string) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const from = tabs.findIndex((tab) => tab.value === value);

    let target: number | null = null;
    if (event.key === "ArrowRight") target = from + 1;
    else if (event.key === "ArrowLeft") target = from - 1;
    else if (event.key === "Home") target = 0;
    else if (event.key === "End") target = tabs.length - 1;
    if (target === null || tabs.length === 0) return;

    event.preventDefault();
    const index = (target + tabs.length) % tabs.length;
    onValueChange(tabs[index].value);

    /* The roving tabindex means the newly selected tab is the only one that
       will take focus, and it has to be moved by hand — the click path never
       gets here, so this is the keyboard's job alone. */
    listRef.current
      ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
      [index]?.focus();
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={LIST}
    >
      {tabs.map((tab) => {
        const selected = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            id={tabId(group, tab.value)}
            aria-selected={selected}
            aria-controls={tabPanelId(group, tab.value)}
            tabIndex={selected ? 0 : -1}
            onClick={() => onValueChange(tab.value)}
            className={selected ? TAB_SELECTED : TAB_IDLE}
          >
            {tab.label}
            <span className={selected ? COUNT_SELECTED : COUNT_IDLE}>
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * `hidden` rather than a conditional render: `aria-controls` has to point at an
 * element that exists, and both panels keep their state while the other is up.
 *
 * `tabIndex={0}` because a panel can hold nothing focusable — the pending list
 * with every invitation cancelled is exactly that — and an unreachable panel is
 * a dead end for anyone driving the page from the keyboard.
 */
export function TabPanel({
  group,
  value,
  active,
  children,
}: {
  group: string;
  value: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      role="tabpanel"
      id={tabPanelId(group, value)}
      aria-labelledby={tabId(group, value)}
      hidden={!active}
      tabIndex={0}
    >
      {children}
    </div>
  );
}
