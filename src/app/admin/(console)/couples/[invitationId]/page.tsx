import { GenerateCoupleReportButton } from "./GenerateCoupleReportButton";
import { CoupleReportView } from "@/components/couple/CoupleReportView";
import { Card } from "@/components/ui/Card";
import { loadCoupleReport } from "@/lib/admin/couple-report";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function AdminCoupleReportPage({
  params,
}: {
  params: Promise<{ invitationId: string }>;
}) {
  const { invitationId } = await params;
  let report;
  try {
    report = await loadCoupleReport(invitationId);
  } catch (error) {
    return (
      <div>
        <Link href="/admin" className="text-sm text-sage">
          All users
        </Link>
        <p className="mt-4 text-ink-soft">{error instanceof Error ? error.message : "Could not load this couple."}</p>
      </div>
    );
  }
  if (!report) notFound();

  const [inviter, invitee] = report.people;

  return (
    <div className="space-y-10">
      <div>
        <Link href="/admin" className="text-sm text-sage">
          All users
        </Link>
        <p className="mt-4 text-xs uppercase tracking-[0.25em] text-sage">Admin</p>
        <h1 className="mt-3 font-serif text-4xl">Couple report</h1>
        <p className="mt-2 text-sm text-ink-soft">
          {inviter.displayName ?? "Inviter"} and {invitee.displayName ?? "Invitee"} · invite {report.invitationStatus}
        </p>
        <p className="mt-1 text-xs text-ink-soft">
          {inviter.email ?? "—"} · {invitee.email ?? "—"}
        </p>
        <p className="mt-1 text-xs text-ink-soft">
          GET/POST <code className="text-ink">/api/admin/couples/{invitationId}</code>
        </p>
        <div className="mt-5">
          <GenerateCoupleReportButton
            invitationId={invitationId}
            label={report.content ? "Regenerate with current algorithm" : "Generate with current algorithm"}
          />
        </div>
      </div>

      {report.content ? (
        <CoupleReportView
          content={report.content}
          kicker="Together"
          title="Understand us"
          headerExtra={
            <p className="mt-3 text-sm text-ink-soft">
              {inviter.displayName ?? inviter.email} ({inviter.answerCount} answers) and{" "}
              {invitee.displayName ?? invitee.email} ({invitee.answerCount} answers).
            </p>
          }
          footer={
            report.prompts.length > 0 ? (
              <section>
                <h2 className="font-serif text-3xl">Conversation guide</h2>
                <div className="mt-5 space-y-4">
                  {report.prompts.map((prompt) => (
                    <Card key={`${prompt.sortOrder}-${prompt.title}`}>
                      <p className="text-xs uppercase tracking-[0.16em] text-sage">{prompt.category}</p>
                      <h3 className="mt-2 font-serif text-xl">{prompt.title}</h3>
                      <p className="mt-2 leading-relaxed text-ink-soft">{prompt.question}</p>
                    </Card>
                  ))}
                </div>
              </section>
            ) : null
          }
        />
      ) : (
        <Card>
          <p className="text-ink-soft">
            No couple report is stored yet. Generate it from both partners&apos; current questionnaire answers.
          </p>
        </Card>
      )}
    </div>
  );
}
