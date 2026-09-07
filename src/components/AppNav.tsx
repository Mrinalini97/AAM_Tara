"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";

const LINKS = [
  { href: "/home", label: "Home" },
  { href: "/profile", label: "My Profile" },
  { href: "/reflection", label: "My Reflection" },
  { href: "/partner", label: "Partner" },
  { href: "/conversations", label: "Conversations" },
  { href: "/settings", label: "Settings" },
];

export function AppNav() {
  const pathname = usePathname();
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
        <Logo href="/home" />
        <nav className="hidden items-center gap-5 text-sm text-ink-soft md:flex">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={pathname.startsWith(link.href) ? "text-ink" : "hover:text-ink"}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <nav className="flex gap-4 overflow-x-auto border-t border-line px-4 py-3 text-sm text-ink-soft md:hidden">
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="whitespace-nowrap">
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
