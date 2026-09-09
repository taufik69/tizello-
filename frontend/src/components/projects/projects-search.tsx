"use client";

import { useEffect, useRef, useState } from "react";
import { useFilterNav } from "@/components/projects/use-filter-nav";
import { CloseIcon } from "@/components/ui/icons";
import { SearchIcon } from "@/components/ui/nav-icons";
import { cn } from "@/lib/cn";
import type { ProjectFilters } from "@/lib/project-filters";
import type { ProjectView } from "@/types/project";

/**
 * Search over name and key — `?q=`, which the list endpoint matches
 * case-insensitively against BOTH (`lib/projects.ts`). Matching the key is the
 * part that matters: people type `TWA`, not "Tizello Web App".
 *
 * IT COLLAPSES TO AN ICON when there is nothing in it, because it shares a
 * 200px strip with three menus and a New button, and a permanently open field
 * would push them off a narrow screen. An ACTIVE search keeps the field open
 * on arrival — a term that is filtering the list must be visible and erasable,
 * or the list is narrowed by something the user cannot see.
 *
 * DEBOUNCED, NOT SUBMITTED. Each keystroke would otherwise be a navigation and
 * a request; 350ms is long enough to finish a word and short enough that the
 * list feels live. Enter still commits immediately, for anyone who types the
 * whole term and expects it to land.
 *
 * THE TIMER IS CLEARED ON UNMOUNT AND THE EFFECT IS THE ONLY ONE HERE. It sets
 * no state — it navigates — so it does not trip
 * `react-hooks/set-state-in-effect`, and the value it reads is the controlled
 * input's, which is the one thing about this that has to be client state.
 */
const DEBOUNCE = 350;

export function ProjectsSearch({
  workspaceId,
  view,
  filters,
}: {
  workspaceId: string;
  view: ProjectView;
  filters: ProjectFilters;
}) {
  const go = useFilterNav({ workspaceId, view, filters });
  const [open, setOpen] = useState(Boolean(filters.q));
  const [value, setValue] = useState(filters.q ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  const committed = filters.q ?? "";

  useEffect(() => {
    if (value === committed) return;

    const timer = setTimeout(() => go({ q: value || undefined }), DEBOUNCE);
    return () => clearTimeout(timer);
  }, [value, committed, go]);

  function reveal() {
    setOpen(true);
    /* Focus after the field exists. `autoFocus` is stripped on the client and
       called during commit, which is before this input is in the document. */
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function clear() {
    setValue("");
    setOpen(false);
    if (committed) go({ q: undefined });
  }

  if (!open) {
    return (
      <button
        type="button"
        aria-label="Search projects"
        onClick={reveal}
        className="grid size-7 place-items-center rounded-sm text-text-muted transition-colors duration-100 ease-standard hover:bg-surface-hover hover:text-text"
      >
        <SearchIcon className="size-3.5" />
      </button>
    );
  }

  return (
    <div
      className={cn(
        "flex h-7 items-center gap-1.5 rounded-sm border border-border bg-surface pr-0.5 pl-2",
        "focus-within:border-border-strong",
      )}
    >
      <SearchIcon className="size-3.5 shrink-0 text-text-subtle" />
      <input
        ref={inputRef}
        type="search"
        value={value}
        aria-label="Search projects by name or key"
        placeholder="Name or key"
        autoComplete="off"
        maxLength={80}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            go({ q: value || undefined });
          }
          /* Escape clears rather than only closing: a collapsed field still
             filtering the list is the failure this control has to avoid. */
          if (event.key === "Escape") clear();
        }}
        /* `appearance-none` drops WebKit's own clear button — there is a real
           one beside it, and two would be two ways to do the same thing with
           different sizes. */
        className="w-28 appearance-none bg-transparent text-xs text-text outline-none placeholder:text-text-subtle sm:w-40 [&::-webkit-search-cancel-button]:hidden"
      />
      <button
        type="button"
        aria-label="Clear search"
        onClick={clear}
        className="grid size-6 shrink-0 place-items-center rounded-xs text-text-subtle transition-colors duration-100 ease-standard hover:bg-surface-hover hover:text-text"
      >
        <CloseIcon className="size-3" />
      </button>
    </div>
  );
}
