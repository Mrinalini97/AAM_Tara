import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const styles: Record<Variant, string> = {
  primary: "bg-flare text-ink hover:bg-gold disabled:opacity-50",
  secondary: "bg-ink text-paper hover:bg-flare hover:text-ink disabled:opacity-50",
  ghost: "bg-transparent text-ink-soft hover:text-flare disabled:opacity-50",
  danger: "bg-transparent text-clay border border-clay/30 hover:bg-clay/10",
};

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode; variant?: Variant }) {
  return (
    <button
      className={`inline-flex items-center justify-center px-5 py-2.5 text-sm tracking-wide transition ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
