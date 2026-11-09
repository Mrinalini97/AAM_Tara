import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const params = new URLSearchParams({ mode: "login" });
  if (next) params.set("next", next);
  if (error) params.set("error", error);
  redirect(`/signup?${params.toString()}`);
}
