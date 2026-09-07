import { Logo } from "@/components/Logo";
import Link from "next/link";

export function PublicHeader({ signedIn }: { signedIn?: boolean }) {
  return (
    <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-6">
      <Logo />
      <nav className="flex items-center gap-4 text-sm text-ink-soft">
        <Link href="/how-it-works" className="hover:text-ink">
          How it works
        </Link>
        {signedIn ? (
          <Link href="/home" className="hover:text-ink">
            Continue
          </Link>
        ) : (
          <>
            <Link href="/login" className="hover:text-ink">
              Sign in
            </Link>
            <Link href="/signup" className="rounded-full bg-sage px-4 py-2 text-paper hover:bg-sage-deep">
              Discover myself
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
