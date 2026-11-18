/**
 * Display-only tidy-up of a verbatim excerpt: page-break markers become an
 * ellipsis and leader runs (".....", "_____") collapse. Stored excerpts are
 * untouched, so the citation check still runs on the exact text.
 */
export function displayExcerpt(text: string): string {
  return text
    .replace(/\s*-{3}\s*page\s+\d+\s*-{3}\s*/gi, " … ")
    .replace(/(?:\s*\.){4,}/g, " … ")
    .replace(/[_\-–—=]{4,}/g, " ")
    .replace(/(?:\s*…\s*){2,}/g, " … ")
    .replace(/\s{2,}/g, " ")
    .replace(/^\s*…\s*/, "")
    .trim();
}

/** Excerpt for display, with "…" where it was clipped mid-sentence. */
export function displayQuote(text: string): string {
  let t = displayExcerpt(text);
  if (/^[a-z]/.test(t) || /^[)\],;:]/.test(t)) t = `…${t.replace(/^[)\],;:]\s*/, "")}`;
  if (/[A-Za-z0-9(,;:\-]$/.test(t)) t = `${t}…`;
  return t;
}
