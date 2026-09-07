import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="font-serif text-xl tracking-wide text-ink">
      Bimbam
    </Link>
  );
}
