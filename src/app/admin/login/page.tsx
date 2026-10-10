import { Logo } from "@/components/Logo";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "./LoginForm";

export default async function AdminLoginPage() {
  if (await isAdminAuthenticated()) redirect("/admin");

  return (
    <div className="min-h-screen px-4 py-16">
      <div className="mb-12 text-center">
        <Logo size="lg" />
        <h1 className="mt-8 font-serif text-3xl">Admin</h1>
        <p className="mt-2 text-ink-soft">Sign in to view user onboarding and questionnaire selections.</p>
      </div>
      <AdminLoginForm />
    </div>
  );
}
