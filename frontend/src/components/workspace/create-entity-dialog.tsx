"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TextField } from "@/components/ui/text-field";

/*
 * One name-and-confirm dialog, used by both "Create workspace" and
 * "New project" — the two differ only in copy.
 *
 * Validation is client-side ONLY and is a convenience, nothing more: there is
 * no persistence behind this yet, so submitting resets the field and closes.
 * `TextField` already owns the field anatomy and the validate-on-blur-then-on-
 * change timing, so nothing here re-implements it.
 */
export type CreateEntityDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  fieldLabel: string;
  placeholder: string;
  submitLabel: string;
  emptyMessage: string;
};

export function CreateEntityDialog({
  open,
  onOpenChange,
  title,
  description,
  fieldLabel,
  placeholder,
  submitLabel,
  emptyMessage,
}: CreateEntityDialogProps) {
  const titleId = useId();
  const [error, setError] = useState<string | undefined>();

  function close() {
    setError(undefined);
    onOpenChange(false);
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const entered = new FormData(form).get("name");
    const name = typeof entered === "string" ? entered.trim() : "";

    if (!name) {
      setError(emptyMessage);
      return;
    }

    form.reset();
    close();
  }

  return (
    <Dialog open={open} onOpenChange={close} aria-labelledby={titleId}>
      {/* noValidate: the browser bubble would pre-empt the inline error, and
          the inline one is the house treatment. */}
      <form onSubmit={onSubmit} noValidate>
        <DialogContent>
          <DialogHeader>
            <DialogTitle id={titleId}>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <TextField
              label={fieldLabel}
              name="name"
              placeholder={placeholder}
              autoComplete="off"
              error={error}
              validate={(value) => (value.trim() ? null : emptyMessage)}
              /* A submit error outranks the field's own, so it has to be
                 cleared by hand once the user starts fixing it. */
              onValueChange={() => setError(undefined)}
            />
          </div>

          <DialogFooter className="mt-5">
            <Button variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button type="submit">{submitLabel}</Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
