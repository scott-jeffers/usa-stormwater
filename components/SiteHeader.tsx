import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-edge/80 bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group flex items-center gap-2.5 text-ink transition-opacity hover:opacity-80"
        >
          <BrandMark className="h-7 w-7 shrink-0" />
          <span className="font-display text-base font-semibold tracking-tight sm:text-lg">
            Stormwater Atlas
          </span>
        </Link>
        <nav className="flex items-center gap-3 text-sm sm:gap-4">
          <Link
            href="/national/"
            className="font-medium text-fg-secondary transition-colors hover:text-water-link"
          >
            Practice synthesis
          </Link>
          <Link
            href="/about/"
            className="font-medium text-fg-secondary transition-colors hover:text-water-link"
          >
            About
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden
      className={className}
    >
      <rect width="64" height="64" rx="14" fill="#0b1c2c" />
      <path
        d="M32 12c8.837 0 16 6.86 16 16.5C48 40.5 32 52 32 52S16 40.5 16 28.5C16 18.86 23.163 12 32 12Z"
        fill="url(#swa-drop-mark)"
      />
      <path
        d="M22 30c1.5 5 4.8 8.6 10 10"
        stroke="#e8f2f5"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.7"
      />
      <defs>
        <linearGradient
          id="swa-drop-mark"
          x1="16"
          y1="12"
          x2="48"
          y2="52"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#22d3ee" />
          <stop offset="1" stopColor="#0e7490" />
        </linearGradient>
      </defs>
    </svg>
  );
}
