import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl space-y-4 py-16 text-center">
      <p className="text-sm font-medium text-water">404</p>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Page not found</h1>
      <p className="text-fg-secondary">
        The manual or page you were looking for isn&rsquo;t here. It may have moved when a record was renamed.
      </p>
      <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 pt-2 text-sm font-medium">
        <Link href="/" className="text-water-link hover:underline">Search all manuals</Link>
        <Link href="/national/model-manual/" className="text-water-link hover:underline">Draft model manual</Link>
        <Link href="/about/" className="text-water-link hover:underline">About the atlas</Link>
      </div>
    </main>
  );
}
