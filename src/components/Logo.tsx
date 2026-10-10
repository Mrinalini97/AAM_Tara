import Link from "next/link";

const SIZE = {
  sm: "text-sm tracking-[0.18em]",
  md: "text-2xl tracking-[0.2em]",
  lg: "text-4xl tracking-[0.18em] md:text-5xl",
  hero: "text-6xl tracking-[-0.04em] sm:text-7xl md:text-8xl lg:text-[7.25rem]",
} as const;

export function Logo({
  href = "/",
  size = "md",
}: {
  href?: string | null;
  size?: keyof typeof SIZE;
}) {
  const content = (
    <span className={`inline-flex items-center gap-2 font-serif leading-none text-current ${SIZE[size]}`}>
      BIMBAM
    </span>
  );

  if (!href) return content;
  return (
    <Link href={href} className="inline-flex items-center" aria-label="Bimbam home">
      {content}
    </Link>
  );
}
