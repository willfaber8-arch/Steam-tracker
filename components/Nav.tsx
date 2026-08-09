"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { VinylMark } from "./VinylMark";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/trends", label: "Trends" },
  { href: "/backlog", label: "Backlog" },
  { href: "/streaks", label: "Streaks" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-cassette-groove/80 bg-cassette-bg/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <VinylMark className="h-7 w-7" />
          <span className="font-serif text-lg tracking-wide text-cassette-cream">
            Steam Tracker
          </span>
        </Link>
        <nav className="flex items-center gap-1 rounded-full border border-cassette-groove bg-cassette-surface p-1">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors sm:px-4 sm:text-sm ${
                  active
                    ? "bg-cassette-amber text-cassette-bg"
                    : "text-cassette-creamdim hover:text-cassette-amber"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
