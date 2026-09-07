import { AuthForm } from "@/components/AuthForm";
import { Logo } from "@/components/Logo";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <div className="min-h-screen px-4 py-16">
      <div className="mb-12 text-center">
        <Logo />
        <h1 className="mt-8 font-serif text-3xl">Begin quietly</h1>
        <p className="mt-2 text-ink-soft">Create an account to start your reflection. Your answers stay private.</p>
      </div>
      <AuthForm mode="signup" nextPath={next || "/discover"} />
    </div>
  );
}
