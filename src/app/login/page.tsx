import { AuthForm } from "@/components/AuthForm";
import { Logo } from "@/components/Logo";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <div className="min-h-screen px-4 py-16">
      <div className="mb-12 text-center">
        <Logo />
        <h1 className="mt-8 font-serif text-3xl">Welcome back</h1>
        <p className="mt-2 text-ink-soft">Sign in to continue your reflection.</p>
      </div>
      <AuthForm mode="login" nextPath={next || "/home"} />
    </div>
  );
}
