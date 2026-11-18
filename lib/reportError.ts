const REPO = "https://github.com/scott-jeffers/usa-stormwater";

/** Link to a prefilled "Report a data error" GitHub issue. */
export function reportErrorHref(slug: string, field?: string, label?: string): string {
  const params = new URLSearchParams({
    template: "data-error.yml",
    title: `Data error: ${slug}${label ? ` — ${label}` : ""}`,
    record: slug,
  });
  if (field) params.set("field", field);
  return `${REPO}/issues/new?${params.toString()}`;
}
