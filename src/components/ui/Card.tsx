import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border border-line bg-white/50 p-6 shadow-[var(--shadow)] ${className}`}>
      {children}
    </div>
  );
}
