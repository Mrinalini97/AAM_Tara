import { generateCoupleReport, loadCoupleReport } from "@/lib/admin/couple-report";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import { NextResponse } from "next/server";

async function unauthorized() {
  if (await isAdminAuthenticated()) return null;
  return NextResponse.json({ error: "Admin sign-in required." }, { status: 401 });
}

function fail(error: unknown, fallbackStatus = 500) {
  const message = error instanceof Error ? error.message : "Something went wrong.";
  const status = message === "Invitation not found." ? 404 : fallbackStatus;
  return NextResponse.json({ error: message }, { status });
}

export async function GET(_request: Request, context: { params: Promise<{ invitationId: string }> }) {
  const denied = await unauthorized();
  if (denied) return denied;

  try {
    const { invitationId } = await context.params;
    const report = await loadCoupleReport(invitationId);
    if (!report) return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
    return NextResponse.json(report);
  } catch (error) {
    return fail(error);
  }
}

export async function POST(_request: Request, context: { params: Promise<{ invitationId: string }> }) {
  const denied = await unauthorized();
  if (denied) return denied;

  try {
    const { invitationId } = await context.params;
    const report = await generateCoupleReport(invitationId);
    return NextResponse.json(report);
  } catch (error) {
    return fail(error);
  }
}
