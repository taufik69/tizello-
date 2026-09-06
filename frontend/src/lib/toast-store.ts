/*
 * The toast store — a tiny external store, deliberately outside React.
 *
 * This is what makes `toast.success("Saved")` callable from anywhere: an event
 * handler, a `.then()`, a `useTransition` callback, a module that has no
 * component around it. A context-based toaster can only be reached from inside
 * the tree it wraps, which is exactly the wrong shape for "report what just
 * happened" — the reporting code is usually the layer furthest from the
 * provider.
 *
 * `<Toaster />` subscribes with `useSyncExternalStore`, so this file stays
 * framework-agnostic (`lib/` may not import `next/*` or React) and the
 * rendering half stays in `components/ui/toaster.tsx`.
 *
 * Deliberately not a dependency. shadcn ships `sonner` for this, which is the
 * right call in an app that needs promise toasts, swipe-to-dismiss, custom
 * JSX payloads and stacking animations. This app needs "a sentence, sometimes
 * red" — and a token-themed 60 lines flips with `light-dark()` for free, where
 * a third-party toaster would need its palette re-mapped to our semantic layer
 * anyway.
 */

export type ToastVariant = "success" | "error" | "info";

export type ToastRecord = {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number;
};

type Listener = () => void;

/**
 * Four seconds. Long enough to read a sentence, short enough that a queue of
 * confirmations does not stack up while someone works through a list.
 */
const DEFAULT_DURATION = 4000;

/**
 * Errors linger. A confirmation that vanishes is fine — the change is visible
 * on the page — but a failure the reader missed leaves them believing something
 * happened that did not.
 */
const ERROR_DURATION = 7000;

let toasts: ToastRecord[] = [];
const listeners = new Set<Listener>();

function emit() {
  /* A NEW array identity every time. `useSyncExternalStore` compares snapshots
     with Object.is, so mutating the existing array in place would be invisible
     to React and nothing would re-render. */
  toasts = [...toasts];
  for (const listener of listeners) listener();
}

function push(message: string, variant: ToastVariant, duration?: number) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  toasts = [
    ...toasts,
    {
      id,
      message,
      variant,
      duration: duration ?? (variant === "error" ? ERROR_DURATION : DEFAULT_DURATION),
    },
  ];

  emit();
  return id;
}

export function dismissToast(id: string) {
  toasts = toasts.filter((entry) => entry.id !== id);
  emit();
}

export function subscribeToToasts(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getToasts() {
  return toasts;
}

/**
 * The server snapshot, and it must be a **stable reference**.
 *
 * `useSyncExternalStore` calls this during SSR and again on every render until
 * hydration finishes; returning a fresh `[]` each time is a new identity, which
 * React treats as a changed snapshot and reports as an infinite loop.
 */
const EMPTY: ToastRecord[] = [];
export function getServerToasts() {
  return EMPTY;
}

/**
 * The public API, shaped like sonner's so the call sites read the way anyone
 * who has used shadcn's toaster expects.
 */
export const toast = Object.assign(
  (message: string, duration?: number) => push(message, "info", duration),
  {
    success: (message: string, duration?: number) => push(message, "success", duration),
    error: (message: string, duration?: number) => push(message, "error", duration),
    info: (message: string, duration?: number) => push(message, "info", duration),
    dismiss: dismissToast,
  },
);
