"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/home", label: "Home" },
  { href: "/profile", label: "My Profile" },
  { href: "/reflection", label: "My Reflection" },
  { href: "/partner", label: "Partner" },
  { href: "/understand-us", label: "Understand us" },
  { href: "/conversations", label: "Conversations" },
  { href: "/settings", label: "Settings" },
];

export function AppNav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-ink text-paper">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/home" className="text-sm tracking-[0.18em]">
          BIMBAM
        </Link>
        <nav className="hidden items-center gap-5 text-sm text-paper/55 md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={pathname.startsWith(link.href) ? "text-flare" : "hover:text-paper"}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <nav className="flex gap-4 overflow-x-auto border-t border-white/10 px-4 py-3 text-sm text-paper/55 md:hidden">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`whitespace-nowrap ${pathname.startsWith(link.href) ? "text-flare" : ""}`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
