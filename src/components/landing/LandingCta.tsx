import Link from "next/link";

export function LandingCta({
  href,
  children,
  tone = "flare",
}: {
  href: string;
  children: React.ReactNode;
  tone?: "flare" | "ink" | "paper";
}) {
  const styles = {
    flare: "bg-flare text-ink hover:bg-gold",
    ink: "bg-ink text-paper hover:bg-flare hover:text-ink",
    paper: "bg-paper text-ink hover:bg-gold",
  }[tone];

  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 px-6 py-3 text-sm font-medium tracking-wide transition-transform duration-200 hover:scale-[1.03] ${styles}`}
    >
      {children}
    </Link>
  );
}
