import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getAllManuals } from "@/lib/data";
import { CRITERIA } from "@/lib/requirements";

export const dynamic = "force-static";

const BASE = SITE_URL;

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = [
    "/",
    "/requirements/",
    "/jurisdictions/",
    "/manual/",
    "/manual/evidence/",
    "/compare/",
    "/resources/",
    "/data/",
    "/archive/",
    "/tools/detention/",
    "/tools/hydraulics/",
    "/federal/",
    "/about/",
  ].map((p) => ({ url: `${BASE}${p}` }));
  for (const c of CRITERIA) pages.push({ url: `${BASE}/requirements/${c.key}/` });
  for (const m of getAllManuals()) pages.push({ url: `${BASE}/${m.slug}/`, lastModified: m.processedAt ?? undefined });
  return pages;
}
