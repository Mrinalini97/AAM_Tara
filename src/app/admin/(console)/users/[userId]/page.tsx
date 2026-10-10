import { loadAdminUser } from "@/lib/admin/data";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { notFound } from "next/navigation";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export default async function AdminUserPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const { detail, error } = await loadAdminUser(userId);
  if (error) {
    return (
      <div>
        <Link href="/admin" className="text-sm text-sage">
          All users
        </Link>
        <p className="mt-4 text-ink-soft">{error}</p>
      </div>
    );
  }
  if (!detail) notFound();

  return (
    <div className="space-y-10">
      <header>
        <Link href="/admin" className="text-sm text-sage">
          All users
        </Link>
        <p className="mt-4 text-xs uppercase tracking-[0.25em] text-sage">Onboarding</p>
        <h1 className="mt-3 font-serif text-4xl">{detail.displayName ?? "Unnamed user"}</h1>
        <p className="mt-2 text-ink-soft">{detail.email ?? "No email"}</p>
      </header>

      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <dt className="text-sm text-ink-soft">Joined</dt>
          <dd className="mt-2">{formatDate(detail.createdAt)}</dd>
        </Card>
        <Card>
          <dt className="text-sm text-ink-soft">Assessment</dt>
          <dd className="mt-2">{detail.assessmentStatus ?? "not started"}</dd>
        </Card>
        <Card>
          <dt className="text-sm text-ink-soft">Selections</dt>
          <dd className="mt-2">
            {detail.answerCount}/{detail.questionTotal}
          </dd>
        </Card>
        <Card>
          <dt className="text-sm text-ink-soft">Partner invite</dt>
          <dd className="mt-2">{detail.invitationStatus ?? "—"}</dd>
          {detail.partnerName ? <dd className="mt-1 text-xs text-ink-soft">{detail.partnerName}</dd> : null}
        </Card>
        <Card>
          <dt className="text-sm text-ink-soft">Couple report</dt>
          <dd className="mt-2">{detail.coupleReportGenerated ? "Generated" : "Not generated"}</dd>
          {detail.coupleReportGeneratedAt ? (
            <dd className="mt-1 text-xs text-ink-soft">{formatDate(detail.coupleReportGeneratedAt)}</dd>
          ) : null}
        </Card>
        <Card>
          <dt className="text-sm text-ink-soft">Opened consolidated</dt>
          <dd className="mt-2">
            {detail.coupleReportGenerated
              ? detail.selfOpenedReportAt && detail.partnerOpenedReportAt
                ? "Both opened"
                : detail.selfOpenedReportAt
                  ? "This person only"
                  : detail.partnerOpenedReportAt
                    ? "Partner only"
                    : "Neither opened"
              : "—"}
          </dd>
          {detail.selfOpenedReportAt ? (
            <dd className="mt-1 text-xs text-ink-soft">This person: {formatDate(detail.selfOpenedReportAt)}</dd>
          ) : null}
          {detail.partnerOpenedReportAt ? (
            <dd className="mt-1 text-xs text-ink-soft">Partner: {formatDate(detail.partnerOpenedReportAt)}</dd>
          ) : null}
        </Card>
      </dl>

      <p className="text-sm text-ink-soft">
        Started {formatDate(detail.startedAt)}. Completed {formatDate(detail.completedAt)}.
      </p>

      {detail.sections.map((section) => (
        <section key={section.title}>
          <h2 className="font-serif text-2xl">{section.title}</h2>
          <div className="mt-4 space-y-4">
            {section.items.map((item) => (
              <Card key={item.questionId}>
                <p className="text-sm leading-relaxed text-ink">{item.question}</p>
                <p className="mt-3 leading-relaxed text-ink-soft">{item.answer}</p>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
