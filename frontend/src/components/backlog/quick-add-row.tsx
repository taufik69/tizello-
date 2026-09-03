"use client";

import { useId, useState } from "react";
import { PlusIcon } from "@/components/ui/icons";

/*
 * The title-only composer pinned under the list — the fast path for getting a
 * thought out of someone's head and into the backlog. Everything else about
 * the task (priority, points, assignee, labels) is filled in later through the
 * editor; a new task defaults to Medium and unassigned.
 *
 * It stays open after a submit and keeps focus, so ten items go in without ten
 * round trips to the mouse. Empty submits are simply refused — a required-field
 * error under a one-line composer is more noise than the mistake.
 */
const TRIGGER =
  "mt-2 flex w-full items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-2.5 text-left text-sm text-text-muted transition-colors duration-100 ease-standard hover:bg-surface-hover hover:text-text";

const INPUT =
  "h-9 w-full rounded-sm border border-border bg-surface px-2.5 text-sm text-text transition-colors duration-100 ease-standard placeholder:text-text-subtle";

export function QuickAddRow({ onAdd }: { onAdd: (title: string) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const fieldId = useId();

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={TRIGGER}>
        <PlusIcon className="size-3.5" />
        Add task
      </button>
    );
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = title.trim();
    if (!value) return;
    onAdd(value);
    setTitle("");
  }

  return (
    <form
      onSubmit={submit}
      className="mt-2 rounded-md border border-border bg-surface p-2"
    >
      <label htmlFor={fieldId} className="sr-only">
        New task title
      </label>
      <input
        id={fieldId}
        name="title"
        value={title}
        autoFocus
        maxLength={200}
        placeholder="What needs doing?"
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
        className={INPUT}
      />

      <div className="mt-2 flex items-center gap-2">
        <button
          type="submit"
          disabled={!title.trim()}
          className="rounded-sm bg-brand-500 px-3 py-1.5 text-xs font-semibold text-on-brand transition-colors duration-100 ease-standard hover:bg-brand-600 disabled:pointer-events-none disabled:opacity-60"
        >
          Add task
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-sm px-2 py-1.5 text-xs text-text-muted transition-colors duration-100 ease-standard hover:bg-surface-hover hover:text-text"
        >
          Cancel
        </button>
        <span className="ml-auto text-2xs text-text-subtle">
          Lands in Medium, unassigned
        </span>
      </div>
    </form>
  );
}
