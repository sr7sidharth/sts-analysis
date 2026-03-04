"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function navLinkClasses(isActive: boolean): string {
  const base =
    "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors";
  if (isActive) {
    return `${base} bg-zinc-900 text-white`;
  }
  return `${base} text-zinc-700 hover:bg-zinc-200`;
}

export function TopNav() {
  const pathname = usePathname();

  const isUpload = pathname === "/";
  const isOverview = pathname.startsWith("/run/overview");

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 backdrop-blur">
      <div className="flex items-center justify-between px-4 py-3">
        <Link href="/" className="text-sm font-semibold text-zinc-900">
          STS Run Analyzer
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/" className={navLinkClasses(isUpload)}>
            Upload runs
          </Link>
          <Link href="/run/overview" className={navLinkClasses(isOverview)}>
            Overview
          </Link>
        </nav>
      </div>
    </header>
  );
}

