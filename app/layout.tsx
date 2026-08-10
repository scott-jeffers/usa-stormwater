import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

const sans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
});

const SITE_URL = "https://stormwateratlas.com";
const SITE_NAME = "Stormwater Atlas";
const DESCRIPTION =
  "Browse U.S. stormwater design manuals in one place. Key requirements from state, county, and city documents—with the source quote for every field.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    url: SITE_URL,
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
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-screen font-sans text-slate-900 antialiased">
        <SiteHeader />
        <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-6xl flex-col px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex-1">{children}</div>
          <Footer />
        </div>
      </body>
    </html>
  );
}

function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200/80 pt-6 pb-2 text-xs text-slate-400">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p>
          <span className="font-display font-semibold text-slate-500">
            Stormwater Atlas
          </span>{" "}
          — data extracted from public agency manuals for research reference
          only; always verify against the current official document.
        </p>
        <p>stormwateratlas.com</p>
      </div>
    </footer>
  );
}
