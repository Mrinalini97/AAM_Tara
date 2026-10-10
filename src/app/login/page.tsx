import { AuthForm } from "@/components/AuthForm";
import { PublicHeader } from "@/components/PublicHeader";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  return (
    <div className="min-h-screen bg-ink text-paper">
      <PublicHeader tone="dark" />
      <div className="mx-auto max-w-md px-4 py-16">
        <p className="text-xs uppercase tracking-[0.28em] text-flare">Welcome back</p>
        <h1 className="mt-4 font-serif text-4xl">Sign in to continue.</h1>
        <p className="mt-3 text-sm text-paper/60">Pick up your reflection where you left it.</p>
        {error ? <p className="mt-4 text-sm text-gold">{error}</p> : null}
        <div className="mt-10">
          <AuthForm mode="login" nextPath={next || "/home"} />
        </div>
      </div>
    </div>
  );
}
