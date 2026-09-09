"use server";

import { revalidatePath } from "next/cache";
import { updateProfile } from "@/lib/profile";
import {
  fieldOrNull,
  validateNickname,
  validatePhone,
  validateProfileName,
} from "@/lib/validation/profile";
import type { Profile } from "@/types/profile";

/*
 * The profile write — `backend/docs/api/user.md`.
 *
 * Thin by rule: validate, call a plain function from `lib/profile.ts`,
 * revalidate. It returns a plain serialisable state rather than throwing,
 * because the calling client leaf renders the outcome inline — a thrown error
 * there produces an error boundary and loses everything typed into the form.
 *
 * Every field is re-validated here. The rules in `lib/validation/profile.ts`
 * also run in the browser, but that is a convenience; this is the control, and
 * the API's Joi schema is the one after that. Three layers, because the two
 * outer ones are skippable by anyone willing to POST by hand.
 */

export type ProfileFormState = {
  ok?: true;
  code?: string;
  fieldErrors?: Record<string, string>;
};

const field = (name: string, message: string): ProfileFormState => ({
  fieldErrors: { [name]: message },
});

export async function updateProfileAction(
  _previous: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const name = fieldOrNull(formData.get("name"));
  const nickname = fieldOrNull(formData.get("nickname"));
  const phone = fieldOrNull(formData.get("phone"));

  const errors: Record<string, string> = {};
  const nameError = name ? validateProfileName(name) : null;
  const nicknameError = nickname ? validateNickname(nickname) : null;
  const phoneError = phone ? validatePhone(phone) : null;
  if (nameError) errors.name = nameError;
  if (nicknameError) errors.nickname = nicknameError;
  if (phoneError) errors.phone = phoneError;
  if (Object.keys(errors).length > 0) return { fieldErrors: errors };

  /* All three are sent every time, `null` included. The form shows the whole
     profile, so an empty field is a field the user cleared — omitting it would
     mean "leave it alone", which is the opposite of what they just did. */
  const result = await updateProfile({ name, nickname, phone });

  if (!result.ok) {
    if (result.code === "VALIDATION_ERROR") {
      return field("name", "Check the fields and try again.");
    }
    return { code: result.code };
  }

  /* The account menu renders the display name and photo on every page, so a
     layout-level revalidate is the granularity this change needs. */
  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * Saves an avatar on its own, separately from the form.
 *
 * A photo is picked and applied in one gesture — there is no "choose a file,
 * then remember to press Save" — so it is its own action rather than a hidden
 * field on the form above. It also means a failed upload cannot discard
 * whatever is half-typed in the other three fields.
 *
 * `avatarUrl` is the path the upload endpoint returned. It is not constructed
 * here and not validated beyond being a string: the API re-checks it against
 * the exact shape its own upload middleware generates, which is the check that
 * matters, because this value reaches the browser of everyone who sees the
 * profile.
 */
export async function saveAvatarAction(
  avatarUrl: string | null,
): Promise<{ ok: true; profile: Profile } | { ok: false; code: string }> {
  const result = await updateProfile({ avatarUrl });

  if (!result.ok) return { ok: false, code: result.code };

  revalidatePath("/", "layout");
  return { ok: true, profile: result.data };
}
