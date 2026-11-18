import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getAllManuals } from "@/lib/data";
import { getNationalReaderIndex } from "@/lib/national";
import { getAllPracticeSyntheses } from "@/lib/practices";

export const dynamic = "force-static";

const BASE = SITE_URL;

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = ["/", "/compare/", "/about/", "/federal/", "/national/", "/national/practices/"].map(
    (p) => ({ url: `${BASE}${p}` })
  );
  for (const m of getAllManuals()) pages.push({ url: `${BASE}/${m.slug}/`, lastModified: m.processedAt ?? undefined });
  for (const s of getNationalReaderIndex().sections) pages.push({ url: `${BASE}/national/${s.id}/` });
  for (const p of getAllPracticeSyntheses()) pages.push({ url: `${BASE}/national/practices/${p.practice_key}/` });
  return pages;
}
