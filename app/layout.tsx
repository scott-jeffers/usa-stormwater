import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "USA Stormwater Manual Extractor",
  description:
    "A one-stop shop for U.S. stormwater design manual requirements, extracted and verified from source documents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </body>
    </html>
  );
}
