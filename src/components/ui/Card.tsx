import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`border border-ink/10 bg-white/40 p-6 ${className}`}>{children}</div>
  );
}
