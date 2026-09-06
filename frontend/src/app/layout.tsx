import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { Toaster } from "@/components/ui/toaster";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";

/*
 * Trello ships Atlassian's proprietary "Charlie Text" / "Charlie Display".
 * Inter is the closest openly-licensed substitute at UI sizes — same x-height
 * ratio, same neutral grotesque skeleton. Swap here to change it everywhere.
 */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Tizello",
    template: "%s · Tizello",
  },
  description: "Boards, lists, and cards to organise anything with your team.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    /*
     * No data-theme on the server: absent means "follow the OS", which is the
     * correct default. THEME_INIT_SCRIPT stamps the attribute before first
     * paint when the user has forced a theme — hence suppressHydrationWarning,
     * since that mutation happens between SSR and hydration.
     *
     * `next/script` with `strategy="beforeInteractive"`, not a raw <script>
     * tag: React 19 warns ("Scripts inside React components are never
     * executed when rendering on the client") whenever a bare <script> is
     * rendered as part of the tree, because React has no way to guarantee a
     * client re-render won't just skip past it as inert markup. `next/script`
     * is Next's escape hatch — it injects the tag outside React's normal
     * reconciliation and, at this strategy, into the initial HTML before any
     * hydration, which is the one place this has to run for the flicker-guard
     * to work at all. `id` is required for inline scripts so Next can track
     * and dedupe it.
     */
    <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <head>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
      </head>
      <body className="min-h-full">
        {children}
        {/* One outlet for the whole app. Mounted here rather than per-screen so
            a toast survives navigation — an action that redirects on success
            (accepting an invitation, signing in) would otherwise unmount its own
            confirmation before it could be read. */}
        <Toaster />
      </body>
    </html>
  );
}
