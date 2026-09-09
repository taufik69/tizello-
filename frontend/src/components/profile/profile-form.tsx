"use client";

import { useActionState, useEffect } from "react";
import { TextField } from "@/components/ui/text-field";
import { updateProfileAction } from "@/lib/actions/profile-actions";
import {
  validateNickname,
  validatePhone,
  validateProfileName,
} from "@/lib/validation/profile";
import { profileErrorCopy, type Profile } from "@/types/profile";
import type { ProfileFormState } from "@/lib/actions/profile-actions";
import { toast } from "sonner";

const EMPTY: ProfileFormState = {};

/*
 * The three editable text fields.
 *
 * **Email is rendered here but not by a `TextField`.** It is not disabled input
 * — it is not input at all: the API refuses the key rather than ignoring it, so
 * a control that looked editable would promise something the server answers
 * `400` to. A `<dl>` row says "this is a fact about your account" in a way a
 * greyed-out box does not.
 *
 * `noValidate` hands validation to us, as everywhere else — the browser's own
 * bubbles cannot be styled, positioned or announced the way these are.
 *
 * Every field is optional, and clearing one is a real edit: the action sends
 * `null` for an empty field rather than omitting it, so emptying the nickname
 * box removes the nickname instead of leaving the old one in place.
 *
 * The Save button is pinned to the card's bottom edge by `mt-auto`, not spaced
 * off the last field. All three profile columns share a height, so this card
 * has slack in it whenever another column is taller — and a fixed margin would
 * leave the button floating in the middle of that slack with empty card under
 * it. The form is the flex column that absorbs it.
 *
 * Full-width would be the auth screens' treatment, where the submit is the only
 * thing on the page. Here it is one of three columns, so it sits right-aligned
 * on its own row instead: a full-width green bar in a third of the page would
 * outweigh everything around it.
 */
export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, formAction, pending] = useActionState(updateProfileAction, EMPTY);

  /* Keyed on `state`, not on `state.ok` — `useActionState` returns a fresh
     object per dispatch, so a second identical save still fires a toast. The
     same reasoning `AuthAlert` documents at length. */
  useEffect(() => {
    if (state.ok) toast.success("Profile updated.");
    else if (state.code) toast.error(profileErrorCopy(state.code));
  }, [state]);

  return (
    <form action={formAction} className="flex flex-1 flex-col gap-4" noValidate>
      <TextField
        label="Full name"
        name="name"
        autoComplete="name"
        defaultValue={profile.name ?? ""}
        placeholder="Alex Rahman"
        validate={validateProfileName}
        error={state.fieldErrors?.name}
      />

      <TextField
        label="Nickname"
        name="nickname"
        autoComplete="nickname"
        defaultValue={profile.nickname ?? ""}
        placeholder="Alex"
        helper="Shown wherever there is room for one word."
        validate={validateNickname}
        error={state.fieldErrors?.nickname}
      />

      <TextField
        label="Phone"
        name="phone"
        type="tel"
        autoComplete="tel"
        defaultValue={profile.phone ?? ""}
        placeholder="01712-345678"
        validate={validatePhone}
        error={state.fieldErrors?.phone}
      />

      <div className="mt-auto flex justify-end border-t border-border pt-4">
        <button
          type="submit"
          disabled={pending}
          className="h-9 rounded-sm bg-brand-500 px-4 text-sm font-semibold text-on-brand transition-colors duration-100 ease-standard hover:bg-brand-400 disabled:pointer-events-none disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
