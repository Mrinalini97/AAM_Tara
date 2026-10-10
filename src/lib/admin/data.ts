import { createServiceSupabase } from "@/lib/supabase/service";
import { QUESTIONS } from "@/lib/questions/data";
import { formatAnswerValue } from "@/lib/questions/format-answer";
import type { AnswerValue } from "@/lib/types";

export type AdminUserRow = {
  userId: string;
  displayName: string | null;
  email: string | null;
  createdAt: string | null;
  assessmentStatus: string | null;
  startedAt: string | null;
  completedAt: string | null;
  answerCount: number;
  questionTotal: number;
  invitationStatus: string | null;
  partnerName: string | null;
  coupleReportGenerated: boolean;
  coupleReportGeneratedAt: string | null;
  selfOpenedReportAt: string | null;
  partnerOpenedReportAt: string | null;
};

export type AdminCoupleRow = {
  invitationId: string;
  inviterId: string;
  inviteeId: string;
  inviterName: string | null;
  inviteeName: string | null;
  inviterEmail: string | null;
  inviteeEmail: string | null;
  invitationStatus: string;
  reportGenerated: boolean;
  reportGeneratedAt: string | null;
  inviterOpenedAt: string | null;
  inviteeOpenedAt: string | null;
};

export type AdminUserDetail = AdminUserRow & {
  sections: { title: string; items: { questionId: string; question: string; answer: string }[] }[];
};

async function emailMap(service: NonNullable<ReturnType<typeof createServiceSupabase>>) {
  const map = new Map<string, string>();
  let page = 1;
  for (;;) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage: 200 });
    if (error || !data?.users?.length) break;
    for (const user of data.users) {
      if (user.email) map.set(user.id, user.email);
    }
    if (data.users.length < 200) break;
    page += 1;
  }
  return map;
}

export function coupleSeenLabel(selfOpenedAt: string | null, partnerOpenedAt: string | null, generated: boolean) {
  if (!generated) return "—";
  if (selfOpenedAt && partnerOpenedAt) return "Both opened";
  if (selfOpenedAt) return "This person only";
  if (partnerOpenedAt) return "Partner only";
  return "Neither opened";
}

export function couplePairSeenLabel(aOpenedAt: string | null, bOpenedAt: string | null, generated: boolean) {
  if (!generated) return "—";
  if (aOpenedAt && bOpenedAt) return "Both opened";
  if (aOpenedAt && !bOpenedAt) return "Inviter only";
  if (!aOpenedAt && bOpenedAt) return "Invitee only";
  return "Neither opened";
}

export async function loadAdminDashboard(): Promise<{
  rows: AdminUserRow[];
  couples: AdminCoupleRow[];
  error?: string;
}> {
  const service = createServiceSupabase();
  if (!service) {
    return { rows: [], couples: [], error: "Add SUPABASE_SERVICE_ROLE_KEY to the server environment to load user data." };
  }

  const [
    { data: profiles, error: profileError },
    { data: assessments },
    { data: answers },
    { data: invitations },
    { data: comparisons },
    viewsResult,
  ] = await Promise.all([
    service.from("profiles").select("id, display_name, created_at").order("created_at", { ascending: false }),
    service.from("assessments").select("user_id, status, started_at, completed_at"),
    service.from("answers").select("user_id"),
    service.from("partner_invitations").select("id, inviter_id, invitee_id, status, created_at").order("created_at", { ascending: false }),
    service.from("comparisons").select("id, invitation_id, user_a_id, user_b_id, created_at"),
    service.from("comparison_views").select("comparison_id, user_id, viewed_at"),
  ]);

  if (profileError) return { rows: [], couples: [], error: profileError.message };

  const emails = await emailMap(service);
  const nameById = new Map((profiles ?? []).map((profile) => [profile.id, profile.display_name as string | null]));
  const assessmentByUser = new Map((assessments ?? []).map((row) => [row.user_id, row]));
  const answerCounts = new Map<string, number>();
  for (const row of answers ?? []) {
    answerCounts.set(row.user_id, (answerCounts.get(row.user_id) ?? 0) + 1);
  }

  const comparisonByInvitation = new Map((comparisons ?? []).map((row) => [row.invitation_id, row]));
  const viewsByComparison = new Map<string, Map<string, string>>();
  if (!viewsResult.error) {
    for (const view of viewsResult.data ?? []) {
      const byUser = viewsByComparison.get(view.comparison_id) ?? new Map<string, string>();
      byUser.set(view.user_id, view.viewed_at);
      viewsByComparison.set(view.comparison_id, byUser);
    }
  }

  type Invitation = {
    id: string;
    inviter_id: string;
    invitee_id: string | null;
    status: string;
    created_at: string;
  };
  const invitationByUser = new Map<string, Invitation>();
  for (const invite of (invitations ?? []) as Invitation[]) {
    if (!invitationByUser.has(invite.inviter_id)) invitationByUser.set(invite.inviter_id, invite);
    if (invite.invitee_id && !invitationByUser.has(invite.invitee_id)) invitationByUser.set(invite.invitee_id, invite);
  }

  const rows: AdminUserRow[] = (profiles ?? []).map((profile) => {
    const assessment = assessmentByUser.get(profile.id);
    const invitation = invitationByUser.get(profile.id);
    const partnerId =
      !invitation?.invitee_id
        ? null
        : invitation.inviter_id === profile.id
          ? invitation.invitee_id
          : invitation.invitee_id === profile.id
            ? invitation.inviter_id
            : null;
    const comparison = invitation ? comparisonByInvitation.get(invitation.id) : undefined;
    const views = comparison ? viewsByComparison.get(comparison.id) : undefined;
    return {
      userId: profile.id,
      displayName: profile.display_name,
      email: emails.get(profile.id) ?? null,
      createdAt: profile.created_at,
      assessmentStatus: assessment?.status ?? null,
      startedAt: assessment?.started_at ?? null,
      completedAt: assessment?.completed_at ?? null,
      answerCount: answerCounts.get(profile.id) ?? 0,
      questionTotal: QUESTIONS.length,
      invitationStatus: invitation?.status ?? null,
      partnerName: partnerId ? (nameById.get(partnerId) ?? null) : null,
      coupleReportGenerated: Boolean(comparison),
      coupleReportGeneratedAt: comparison?.created_at ?? null,
      selfOpenedReportAt: views?.get(profile.id) ?? null,
      partnerOpenedReportAt: partnerId ? (views?.get(partnerId) ?? null) : null,
    };
  });

  const couples: AdminCoupleRow[] = (invitations ?? [])
    .filter((invite) => Boolean(invite.invitee_id))
    .map((invite) => {
      const inviteeId = invite.invitee_id as string;
      const comparison = comparisonByInvitation.get(invite.id);
      const views = comparison ? viewsByComparison.get(comparison.id) : undefined;
      return {
        invitationId: invite.id,
        inviterId: invite.inviter_id,
        inviteeId,
        inviterName: nameById.get(invite.inviter_id) ?? null,
        inviteeName: nameById.get(inviteeId) ?? null,
        inviterEmail: emails.get(invite.inviter_id) ?? null,
        inviteeEmail: emails.get(inviteeId) ?? null,
        invitationStatus: invite.status,
        reportGenerated: Boolean(comparison),
        reportGeneratedAt: comparison?.created_at ?? null,
        inviterOpenedAt: views?.get(invite.inviter_id) ?? null,
        inviteeOpenedAt: views?.get(inviteeId) ?? null,
      };
    });

  return { rows, couples };
}

export async function loadAdminUsers() {
  return loadAdminDashboard();
}

export async function loadAdminUser(userId: string): Promise<{ detail: AdminUserDetail | null; error?: string }> {
  const { rows, error } = await loadAdminDashboard();
  if (error) return { detail: null, error };
  const row = rows.find((item) => item.userId === userId);
  if (!row) return { detail: null };

  const service = createServiceSupabase();
  if (!service) return { detail: null, error: "Add SUPABASE_SERVICE_ROLE_KEY to the server environment." };

  const { data: answerRows, error: answerError } = await service
    .from("answers")
    .select("question_id, value")
    .eq("user_id", userId);

  if (answerError) return { detail: null, error: answerError.message };

  const byQuestion = new Map((answerRows ?? []).map((item) => [item.question_id, item.value as AnswerValue]));
  const sectionMap = new Map<string, AdminUserDetail["sections"][number]>();

  for (const question of QUESTIONS) {
    const block = sectionMap.get(question.dimension) ?? { title: question.sectionTitle, items: [] };
    block.items.push({
      questionId: question.id,
      question: question.question,
      answer: formatAnswerValue(question.id, byQuestion.get(question.id)),
    });
    sectionMap.set(question.dimension, block);
  }

  return { detail: { ...row, sections: [...sectionMap.values()] } };
}
