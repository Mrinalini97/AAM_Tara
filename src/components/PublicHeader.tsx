import Link from "next/link";

export function PublicHeader({
  signedIn,
  tone = "light",
}: {
  signedIn?: boolean;
  tone?: "light" | "dark";
}) {
  const startHref = signedIn ? "/discover" : "/signup";
  const dark = tone === "dark";

  return (
    <header
      className={`sticky top-0 z-30 border-b ${
        dark ? "border-white/10 bg-ink text-paper" : "border-line bg-paper text-ink"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-sm tracking-[0.18em]">
          BIMBAM
        </Link>
        <nav
          className={`flex items-center gap-x-4 text-sm sm:gap-6 ${dark ? "text-paper/70" : "text-ink-soft"}`}
        >
          <Link href="/#how-it-works" className={dark ? "hover:text-paper" : "hover:text-ink"}>
            How it works
          </Link>
          {signedIn ? (
            <Link href="/home" className={dark ? "hover:text-paper" : "hover:text-ink"}>
              Continue
            </Link>
          ) : (
            <Link href="/login" className={dark ? "hover:text-paper" : "hover:text-ink"}>
              Sign in
            </Link>
          )}
          <Link
            href={startHref}
            className={
              dark
                ? "bg-flare px-3 py-1.5 text-ink hover:bg-gold"
                : "bg-ink px-3 py-1.5 text-paper hover:bg-flare"
            }
          >
            Get started
          </Link>
        </nav>
      </div>
    </header>
  );
}
