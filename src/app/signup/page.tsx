import { GetStartedForm } from "@/components/GetStartedForm";
import { PublicHeader } from "@/components/PublicHeader";
export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; mode?: string; error?: string }>;
}) {
  const { next, mode, error } = await searchParams;
  const initialMode = mode === "login" ? "login" : "signup";
  return (
    <div className="min-h-screen bg-ink text-paper">
      <PublicHeader tone="dark" />
      <div className="mx-auto max-w-md px-4 py-16">
        <p className="text-xs uppercase tracking-[0.28em] text-flare">Get started</p>
        <h1 className="mt-4 font-serif text-4xl">Go beyond the biodata.</h1>
        <p className="mt-3 text-sm text-paper/60">
          Create an account, or sign in if you already have one. Your answers stay private.
        </p>
        <div className="mt-10">
          <GetStartedForm
            initialMode={initialMode}
            nextPath={next ?? ""}
            serverError={error}
          />
        </div>
      </div>
    </div>
  );
}
