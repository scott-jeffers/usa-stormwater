import type { Metadata } from "next";

/** The host Netlify serves (the bare domain redirects here). */
export const SITE_URL = "https://www.stormwateratlas.com";
export const SITE_NAME = "Stormwater Atlas";

/** Per-page canonical URL + share-card metadata (paths relative to SITE_URL). */
export function pageMeta(path: string, title: string, description: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", siteName: SITE_NAME, url: path, title: `${title} · ${SITE_NAME}`, description },
    twitter: { card: "summary", title: `${title} · ${SITE_NAME}`, description },
  };
}
