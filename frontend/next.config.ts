import type { NextConfig } from "next";

import { SERVER_ACTION_BODY_LIMIT } from "./src/lib/upload-limits";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      /*
       * A file is uploaded THROUGH a Server Action (`lib/actions/upload-actions.ts`
       * — the session cookies are httpOnly on this origin, so the browser
       * cannot post to the API directly). Next caps an action body at 1 MB by
       * default and rejects the request rather than returning an error from
       * it, so anything larger threw past the drawer and rendered the
       * segment's `error.tsx`. Imported rather than typed twice: the reason
       * this number is what it is lives in `lib/upload-limits.ts`.
       */
      bodySizeLimit: SERVER_ACTION_BODY_LIMIT,
    },
  },

  /*
   * Development only. Next blocks cross-origin requests to dev assets, and the
   * failure is silent: the page renders but the client bundle never loads, so
   * nothing hydrates. Anyone opening the dev server from another device on the
   * LAN — a phone, a second machine — needs their host listed here.
   */
  allowedDevOrigins: ["192.168.1.193"],

  images: {
    /*
     * Next 16 requires an explicit allowlist; anything outside it is coerced to
     * the nearest entry. Listing only 100 means every <Image> — including ones
     * that omit the prop and would otherwise default to 75 — is served at full
     * quality, which is the house rule.
     *
     * AVIF/WebP are what keep the byte cost of that reasonable.
     */
    qualities: [100],
    formats: ["image/avif", "image/webp"],

    /*
     * Remote hosts must be listed before next/image will optimise them.
     * Add entries here rather than reaching for `unoptimized`.
     * e.g. { protocol: "https", hostname: "images.example.com" }
     */
    remotePatterns: [],
  },
};

export default nextConfig;
