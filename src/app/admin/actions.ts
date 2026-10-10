"use server";

import { redirect } from "next/navigation";
import { clearAdminSession, createAdminSession, verifyAdminCredentials } from "@/lib/admin/auth";

export async function adminLogin(_prev: { error: string } | null, formData: FormData) {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!verifyAdminCredentials(username, password)) {
    return { error: "Invalid username or password." };
  }
  await createAdminSession();
  redirect("/admin");
}

export async function adminLogout() {
  await clearAdminSession();
  redirect("/admin/login");
}
