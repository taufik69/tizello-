"use client";

import { useActionState, useRef, useState } from "react";
import { PlusIcon } from "@/components/ui/icons";
import {
  createCardAction,
  type CreateCardState,
} from "@/lib/actions/board-actions";

/**
 * The card composer — the ONLY Client Component on the board page.
 *
 * It owns open/closed state and a form submission, so it cannot live on the
 * server. Everything around it (columns, cards, badges) stays server-rendered:
 * this file is a leaf, and importing it does not pull the page across the
 * boundary.
 */
export function AddCardForm({
  boardId,
  listId,
  listTitle,
}: {
  boardId: string;
  listId: string;
  listTitle: string;
}) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, pending] = useActionState<CreateCardState, FormData>(
    async (previous, formData) => {
      const result = await createCardAction(previous, formData);
      if (!result.error) formRef.current?.reset();
      return result;
    },
    {},
  );

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 flex w-full items-center gap-1.5 rounded-sm px-2 py-1.5 text-left text-sm text-text-muted transition-colors duration-100 ease-standard hover:bg-surface-hover hover:text-text"
      >
        <PlusIcon className="size-3.5" />
        Add a card
        <span className="sr-only">to {listTitle}</span>
      </button>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="mt-2 space-y-2">
      <input type="hidden" name="boardId" value={boardId} />
      <input type="hidden" name="listId" value={listId} />

      <label className="sr-only" htmlFor={`new-card-${listId}`}>
        Card title for {listTitle}
      </label>
      <textarea
        id={`new-card-${listId}`}
        name="title"
        rows={2}
        required
        autoFocus
        maxLength={200}
        placeholder="Enter a title…"
        aria-describedby={state.error ? `new-card-error-${listId}` : undefined}
        className="w-full resize-none rounded-md border border-border bg-surface p-2 text-sm text-text shadow-card placeholder:text-text-subtle"
      />

      {state.error && (
        <p id={`new-card-error-${listId}`} role="alert" className="text-2xs text-danger">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-sm bg-brand-500 px-3 py-1.5 text-sm font-semibold text-on-brand transition-colors duration-100 ease-standard hover:bg-brand-400 disabled:opacity-60"
        >
          {pending ? "Adding…" : "Add card"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-sm px-2 py-1.5 text-sm text-text-muted transition-colors duration-100 ease-standard hover:bg-surface-hover hover:text-text"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
