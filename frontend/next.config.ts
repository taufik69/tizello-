import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
