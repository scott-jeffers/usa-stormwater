"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/** Small-screen menu; closes on navigation, Escape, or a click outside. */
export function MobileMenu({ items }: { items: Array<{ href: string; label: string }> }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const path = usePathname();
  useEffect(() => {
    if (ref.current) ref.current.open = false;
  }, [path]);
  useEffect(() => {
    const close = (e: Event) => {
      const d = ref.current;
      if (!d?.open) return;
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !d.contains(e.target as Node)) d.open = false;
    };
    document.addEventListener("click", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", close);
    };
  }, []);
  return (
    <details ref={ref} className="relative lg:hidden">
      <summary aria-label="Menu" className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-md text-fg-secondary hover:bg-surface-muted [&::-webkit-details-marker]:hidden">
        <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path d="M3 6h14M3 10h14M3 14h14" strokeLinecap="round" />
        </svg>
      </summary>
      <nav aria-label="Main" className="absolute right-0 top-11 w-60 rounded-md border border-edge-strong bg-surface py-1">
        {items.map((n) => (
          <Link key={n.href} href={n.href} aria-current={path.startsWith(n.href) ? "page" : undefined} className="block px-4 py-3 text-sm font-medium text-foreground hover:bg-surface-muted aria-[current=page]:text-water-link">
            {n.label}
          </Link>
        ))}
      </nav>
    </details>
  );
}

/** Wide-screen links, marking the current section. */
export function NavLinks({ items }: { items: Array<{ href: string; label: string }> }) {
  const path = usePathname();
  return (
    <nav aria-label="Main" className="ml-auto hidden items-center gap-1 text-sm lg:flex">
      {items.map((n) => (
        <Link
          key={n.href}
          href={n.href}
          aria-current={path.startsWith(n.href) ? "page" : undefined}
          className="whitespace-nowrap rounded-md px-2.5 py-2 font-medium text-fg-secondary hover:text-water-link aria-[current=page]:text-foreground aria-[current=page]:underline aria-[current=page]:decoration-water aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-[18px]"
        >
          {n.label}
        </Link>
      ))}
    </nav>
  );
}
