import type { Metadata } from "next";
import Link from "next/link";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import { THEME_BOOT_SCRIPT } from "@/lib/theme";
import "./globals.css";

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-sans",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
});

import { SITE_NAME, SITE_URL } from "@/lib/site";
const DESCRIPTION =
  "Browse U.S. stormwater design manuals in one place. Key requirements from federal, state, county, and city documents—with the source quote for every field.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: SITE_NAME,
    description: DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="min-h-screen font-sans text-foreground antialiased">
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-water-link focus:shadow"
        >
          Skip to content
        </a>
        <SiteHeader />
        <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-6xl flex-col px-4 py-8 sm:px-6 lg:px-8">
          <div id="content" data-pagefind-body className="flex-1">{children}</div>
          <Footer />
        </div>
      </body>
    </html>
  );
}

function Footer() {
  return (
    <footer data-pagefind-ignore="all" className="mt-16 border-t border-edge pt-6 pb-2 text-xs text-fg-subtle">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p>
          <span className="font-semibold text-fg-muted">
            Stormwater Atlas
          </span>{" "}
          — data extracted from public agency manuals for research reference
          only; always verify against the current official document.{" "}
          <Link href="/about/" className="text-water-link hover:underline">
            About &amp; data API
          </Link>
        </p>
        <p>stormwateratlas.com</p>
      </div>
    </footer>
  );
}
