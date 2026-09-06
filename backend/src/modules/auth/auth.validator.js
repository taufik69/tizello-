/**
 * Joi schemas for the auth module — request **shape** only. Whether an email is
 * already taken, whether a password is weak, whether a token is still live: all
 * of that is the service's, because it needs the database and it is a business
 * rule, not a shape.
 *
 * **Email normalization happens here and only here.** Every schema lowercases
 * and trims, and `validate` writes the coerced value back onto `req.body`, so
 * every layer downstream sees the canonical form. `Alice@Example.com ` and
 * `alice@example.com` must be one account — normalize in two places and they
 * eventually stop agreeing; normalize in none and the unique index lets both
 * exist. The one place this is *not* enough is the rate limiter, which runs
 * before validation and therefore normalizes its own key (sprint 6 §6.2).
 *
 * See .claude/skills/module-consistency/SKILL.md and docs/api/auth.md
 */

import Joi from 'joi';

// 254 is the maximum length of an email address per RFC 5321, and the width of
// the column. `tlds: false` disables Joi's built-in TLD allowlist, which is a
// snapshot that goes stale and rejects real addresses on newer TLDs.
const email = Joi.string().trim().lowercase().email({ tlds: false }).max(254).required();

// 8 is the floor the frontend also enforces; 128 is an upper bound rather than
// a security property — bcrypt silently truncates at 72 bytes, so anything
// beyond that is already not contributing entropy, and an unbounded field is a
// cheap way to make a server spend CPU.
const password = Joi.string().min(8).max(128).required();

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).required(),
  email,
  password,
  // Optional, and deliberately not validated beyond "a string": a bad invite
  // token must NOT fail the registration (sprint 8 §8.4). Rejecting it here
  // would turn a stale link into a lost account, which is the exact failure
  // that fix exists to prevent — the service tries it and shrugs.
  inviteToken: Joi.string().max(200).optional(),
});

const loginSchema = Joi.object({
  email,
  // Not `password` above: no min/max here. Length rules on a *login* field tell
  // an attacker the password policy and can reject a legacy password that is
  // still correct. Shape validation belongs at registration, where it changes
  // what gets stored.
  password: Joi.string().max(128).required(),
});

const verifyEmailSchema = Joi.object({
  token: Joi.string().max(200).required(),
});

const resendVerificationSchema = Joi.object({ email });

const requestCodeSchema = Joi.object({ email });

const verifyCodeSchema = Joi.object({
  email,
  // Exactly six digits, as a string. A Joi `number` would accept `4213` and
  // strip the leading zero from `004213`, turning a valid code into a wrong one.
  code: Joi.string()
    .pattern(/^[0-9]{6}$/)
    .required(),
});

const forgotPasswordSchema = Joi.object({ email });

const resetPasswordSchema = Joi.object({
  token: Joi.string().max(200).required(),
  password,
});

export {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  requestCodeSchema,
  verifyCodeSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
