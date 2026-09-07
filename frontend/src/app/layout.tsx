import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import { Toaster } from "@/components/ui/sonner";
import { themeFromCookies } from "@/lib/theme";
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

export default async function RootLayout({ children }: LayoutProps<"/">) {
  /*
   * The forced theme, straight out of the cookie the toggle writes — no
   * `data-theme` attribute at all when the user is on "system", which is what
   * hands the decision to `color-scheme: light dark` in globals.css.
   *
   * Reading it here is what replaced the blocking inline <script> this used to
   * carry: the palette is now correct in the first byte of HTML rather than
   * corrected by JavaScript before paint, so there is no flash, no
   * `suppressHydrationWarning`, and no <script> for React 19 to warn about
   * (see `lib/theme.ts`).
   */
  const theme = themeFromCookies((await cookies()).toString());

  return (
    <html
      lang="en"
      className={`${inter.variable} h-full`}
      {...(theme === "system" ? {} : { "data-theme": theme })}
    >
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
