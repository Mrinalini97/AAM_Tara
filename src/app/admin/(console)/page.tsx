import { loadAdminDashboard, coupleSeenLabel, couplePairSeenLabel } from "@/lib/admin/data";
import { Card } from "@/components/ui/Card";
import Link from "next/link";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

export default async function AdminDashboardPage() {
  const { rows, couples, error } = await loadAdminDashboard();
  const completed = rows.filter((row) => row.assessmentStatus === "completed").length;
  const inProgress = rows.filter((row) => row.assessmentStatus === "in_progress").length;
  const reports = couples.filter((couple) => couple.reportGenerated).length;
  const bothOpened = couples.filter((couple) => couple.inviterOpenedAt && couple.inviteeOpenedAt).length;

  return (
    <div className="space-y-10">
      <header>
        <p className="text-xs uppercase tracking-[0.25em] text-sage">Admin</p>
        <h1 className="mt-3 font-serif text-4xl">User onboarding</h1>
        <p className="mt-3 max-w-2xl text-sm text-ink-soft">
          Only admins can open this dashboard. Open a person to read their questionnaire selections.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-sm text-ink-soft">Accounts</p>
          <p className="mt-2 font-serif text-3xl">{rows.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-ink-soft">Completed reflection</p>
          <p className="mt-2 font-serif text-3xl">{completed}</p>
        </Card>
        <Card>
          <p className="text-sm text-ink-soft">Couple reports</p>
          <p className="mt-2 font-serif text-3xl">{reports}</p>
        </Card>
        <Card>
          <p className="text-sm text-ink-soft">Both opened report</p>
          <p className="mt-2 font-serif text-3xl">{bothOpened}</p>
          <p className="mt-1 text-xs text-ink-soft">{inProgress} assessments in progress</p>
        </Card>
      </div>

      {error ? (
        <Card>
          <p className="text-ink-soft">{error}</p>
        </Card>
      ) : null}

      <section className="space-y-4">
        <h2 className="font-serif text-2xl">Couples</h2>
        <p className="text-sm text-ink-soft">
          Whether the shared report exists, and whether each partner has opened Understand us.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line text-ink-soft">
                <th className="py-2 pr-4 font-normal">Inviter</th>
                <th className="py-2 pr-4 font-normal">Invitee</th>
                <th className="py-2 pr-4 font-normal">Invite</th>
                <th className="py-2 pr-4 font-normal">Couple report</th>
                <th className="py-2 pr-4 font-normal">Opened consolidated</th>
              </tr>
            </thead>
            <tbody>
              {couples.map((couple) => (
                <tr key={couple.invitationId} className="border-b border-line/60">
                  <td className="py-3 pr-4">
                    <Link href={`/admin/users/${couple.inviterId}`} className="text-sage underline-offset-2 hover:underline">
                      {couple.inviterName ?? "—"}
                    </Link>
                    <span className="block text-xs text-ink-soft">{couple.inviterEmail ?? "—"}</span>
                    <span className="block text-xs text-ink-soft">
                      {couple.inviterOpenedAt ? `Opened ${formatDate(couple.inviterOpenedAt)}` : "Not opened"}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <Link href={`/admin/users/${couple.inviteeId}`} className="text-sage underline-offset-2 hover:underline">
                      {couple.inviteeName ?? "—"}
                    </Link>
                    <span className="block text-xs text-ink-soft">{couple.inviteeEmail ?? "—"}</span>
                    <span className="block text-xs text-ink-soft">
                      {couple.inviteeOpenedAt ? `Opened ${formatDate(couple.inviteeOpenedAt)}` : "Not opened"}
                    </span>
                  </td>
                  <td className="py-3 pr-4">{couple.invitationStatus}</td>
                  <td className="py-3 pr-4">
                    {couple.reportGenerated ? "Generated" : "Not generated"}
                    {couple.reportGeneratedAt ? (
                      <span className="block text-xs text-ink-soft">{formatDate(couple.reportGeneratedAt)}</span>
                    ) : null}
                  </td>
                  <td className="py-3 pr-4">
                    {couplePairSeenLabel(couple.inviterOpenedAt, couple.inviteeOpenedAt, couple.reportGenerated)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!error && couples.length === 0 ? (
          <Card>
            <p className="text-ink-soft">No partner pairs yet.</p>
          </Card>
        ) : null}
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl">People</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line text-ink-soft">
                <th className="py-2 pr-4 font-normal">Name</th>
                <th className="py-2 pr-4 font-normal">Email</th>
                <th className="py-2 pr-4 font-normal">Joined</th>
                <th className="py-2 pr-4 font-normal">Onboarding</th>
                <th className="py-2 pr-4 font-normal">Selections</th>
                <th className="py-2 pr-4 font-normal">Partner</th>
                <th className="py-2 pr-4 font-normal">Couple report</th>
                <th className="py-2 pr-4 font-normal">Opened report</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.userId} className="border-b border-line/60">
                  <td className="py-3 pr-4">
                    <Link href={`/admin/users/${row.userId}`} className="text-sage underline-offset-2 hover:underline">
                      {row.displayName ?? "—"}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-ink-soft">{row.email ?? "—"}</td>
                  <td className="py-3 pr-4">{formatDate(row.createdAt)}</td>
                  <td className="py-3 pr-4">
                    {row.assessmentStatus ?? "not started"}
                    {row.completedAt ? (
                      <span className="block text-xs text-ink-soft">{formatDate(row.completedAt)}</span>
                    ) : null}
                  </td>
                  <td className="py-3 pr-4">
                    {row.answerCount}/{row.questionTotal}
                  </td>
                  <td className="py-3 pr-4">
                    {row.partnerName ?? "—"}
                    {row.invitationStatus ? (
                      <span className="block text-xs text-ink-soft">{row.invitationStatus}</span>
                    ) : null}
                  </td>
                  <td className="py-3 pr-4">
                    {row.coupleReportGenerated ? "Generated" : "Not generated"}
                    {row.coupleReportGeneratedAt ? (
                      <span className="block text-xs text-ink-soft">{formatDate(row.coupleReportGeneratedAt)}</span>
                    ) : null}
                  </td>
                  <td className="py-3 pr-4">
                    {coupleSeenLabel(row.selfOpenedReportAt, row.partnerOpenedReportAt, row.coupleReportGenerated)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {!error && rows.length === 0 ? (
        <Card>
          <p className="text-ink-soft">No profiles yet.</p>
        </Card>
      ) : null}
    </div>
  );
}
