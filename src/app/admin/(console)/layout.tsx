import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import { adminLogout } from "../actions";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AdminConsoleLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  return (
    <div className="min-h-screen">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-6">
            <Logo href="/admin" size="sm" />
            <nav className="flex items-center gap-4 text-sm text-ink-soft">
              <Link href="/admin" className="hover:text-ink">
                Users
              </Link>
            </nav>
          </div>
          <form action={adminLogout}>
            <Button type="submit" variant="ghost">
              Sign out
            </Button>
          </form>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-10">{children}</div>
    </div>
  );
}
