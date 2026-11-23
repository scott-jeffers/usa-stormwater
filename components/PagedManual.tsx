"use client";

import { useEffect, useRef, useState } from "react";
import { PRINT_CSS } from "@/lib/manual/printCss";

declare global {
  interface Window {
    __PAGED_DONE?: number;
  }
}

/**
 * Paginates the hidden #pm-source with Paged.js into real Letter pages
 * (running heads, page numbers, a contents list with page numbers), which
 * the browser then prints as-is. scripts/manual-pdf.ts prints this page to
 * /downloads/model-manual.pdf.
 */
export function PagedManual({ version }: { version: string }) {
  const target = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // The prebuilt UMD bundle (public/vendor) runs as-is; bundling Paged.js's sources breaks its event mixins.
        await new Promise<void>((resolve, reject) => {
          if ((window as unknown as { PagedModule?: unknown }).PagedModule) return resolve();
          const sc = document.createElement("script");
          sc.src = "/vendor/paged-0.4.3.min.js";
          sc.onload = () => resolve();
          sc.onerror = () => reject(new Error("Paged.js did not load"));
          document.head.appendChild(sc);
        });
        const { Previewer } = (window as unknown as { PagedModule: typeof import("pagedjs") }).PagedModule;
        const root = document.getElementById("pm-source")!.firstElementChild!;
        const src = document.createDocumentFragment();
        for (const child of Array.from(root.children)) src.appendChild(child.cloneNode(true));
        // ids must be unique in the document once the pages are drawn
        document.getElementById("pm-source")!.remove();
        const flow = await new Previewer().preview(src, [{ "/manual-print.css": PRINT_CSS }], target.current);
        if (cancelled) return;
        setPages(flow.total);
        window.__PAGED_DONE = flow.total;
      } catch (e) {
        console.error(e);
        setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <div className="pm-chrome mb-6 flex flex-wrap items-center gap-3 border-b border-edge pb-4 text-sm">
        {/* full page load: the paged-media stylesheet must not follow a client-side navigation */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/manual/" className="font-medium text-water-link">← Back to the online manual</a>
        <span className="text-fg-muted" aria-live="polite">
          {failed ? "Could not paginate in this browser; the download below still works." : pages ? `${version} · ${pages} pages` : "Laying out pages…"}
        </span>
        <span className="ml-auto flex gap-2">
          <a href="/downloads/model-manual.pdf" download className="h-9 rounded-md bg-water-link px-4 font-medium leading-9 text-white">
            Download PDF
          </a>
          <button type="button" onClick={() => window.print()} disabled={!pages} className="h-9 rounded-md border border-edge-strong px-4 font-medium disabled:opacity-50">
            Print
          </button>
        </span>
      </div>
      <div ref={target} className="pm-pages" />
    </>
  );
}
