import { AuthForm } from "@/components/AuthForm";
import { PublicHeader } from "@/components/PublicHeader";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <div className="min-h-screen bg-ink text-paper">
      <PublicHeader tone="dark" />
      <div className="mx-auto max-w-md px-4 py-16">
        <p className="text-xs uppercase tracking-[0.28em] text-flare">Get started</p>
        <h1 className="mt-4 font-serif text-4xl">Go beyond the biodata.</h1>
        <p className="mt-3 text-sm text-paper/60">Create an account to begin. Your answers stay private.</p>
        <div className="mt-10">
          <AuthForm mode="signup" nextPath={next || "/discover"} />
        </div>
      </div>
    </div>
  );
}
