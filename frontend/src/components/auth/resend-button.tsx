"use client";

import { useEffect, useState } from "react";

/*
 * "Resend", disabled for 60s with a visible countdown. Used wherever we have
 * just sent something the user might not receive: the login code, the recovery
 * link, the verification link.
 *
 * The countdown starts armed rather than idle — by the time this renders,
 * something has already been sent, so offering an immediate resend would just
 * invite a double send.
 *
 * It is a button, not a link: resending mutates state, and a GET that mutates
 * gets fired by link prefetchers.
 */
export function ResendButton({
  email,
  label,
  resend,
  cooldown = 60,
}: {
  email: string;
  label: string;
  resend: (email: string) => Promise<void>;
  cooldown?: number;
}) {
  const [left, setLeft] = useState(cooldown);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (left <= 0) return;
    const timer = setTimeout(() => setLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [left]);

  const waiting = left > 0;

  return (
    <button
      type="button"
      disabled={waiting || sending}
      onClick={async () => {
        setSending(true);
        await resend(email);
        setSending(false);
        setLeft(cooldown);
      }}
      className="rounded-sm text-2xs font-semibold text-text-brand transition-colors duration-100 ease-standard hover:underline disabled:font-medium disabled:text-text-subtle disabled:no-underline"
    >
      {waiting ? `${label} (${left}s)` : label}
      <span aria-live="polite" className="sr-only">
        {waiting ? "" : `${label} is available again.`}
      </span>
    </button>
  );
}
