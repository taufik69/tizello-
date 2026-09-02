import type { Metadata } from "next";
import { Inter } from "next/font/google";
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
     */
    <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
