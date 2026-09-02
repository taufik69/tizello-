"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

const FALLBACK_SRC = "/image-fallback.svg";

type AppImageProps = Omit<ImageProps, "quality"> & {
  /** Shown when `src` fails to load. Defaults to a neutral placeholder tile. */
  fallbackSrc?: string;
};

/**
 * The only image component in the app. Wraps next/image to guarantee the three
 * house rules in one place: quality 100, lazy by default, and a fallback when
 * the source 404s or the host is unreachable.
 *
 * It is a Client Component solely because next/image's `onError` is a function
 * prop and cannot be serialised across the RSC boundary. Keep it a leaf —
 * importing it does NOT make the surrounding page a Client Component.
 */
export function AppImage({
  src,
  alt,
  fallbackSrc = FALLBACK_SRC,
  loading = "lazy",
  onError,
  ...rest
}: AppImageProps) {
  // Storing the failed src (not a boolean) means a later src change retries
  // instead of being stuck on the fallback.
  const [failedSrc, setFailedSrc] = useState<ImageProps["src"] | null>(null);
  const errored = failedSrc !== null && failedSrc === src;

  return (
    <Image
      {...rest}
      src={errored ? fallbackSrc : src}
      alt={alt}
      quality={100}
      loading={loading}
      onError={(event) => {
        setFailedSrc(src);
        onError?.(event);
      }}
    />
  );
}
