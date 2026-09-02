"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Sends the browser on after a beat. Renders nothing — the page it sits on
 * always offers the same destination as a real link too, so anyone who does not
 * want to wait (or has JavaScript off) is never stranded.
 */
export function AutoRedirect({ to, delayMs = 2000 }: { to: string; delayMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => router.replace(to), delayMs);
    return () => clearTimeout(timer);
  }, [router, to, delayMs]);

  return null;
}
