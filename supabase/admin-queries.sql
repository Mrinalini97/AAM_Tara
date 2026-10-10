-- Optional: run in Supabase SQL editor to inspect completion status (project owner).
-- Does not bypass RLS when run as postgres in dashboard.

select
  p.display_name,
  u.email,
  a.status as assessment_status,
  a.completed_at,
  (rp.id is not null) as has_relationship_profile,
  pi.status as invitation_status,
  pi.inviter_id,
  pi.invitee_id
from public.profiles p
join auth.users u on u.id = p.id
left join public.assessments a on a.user_id = p.id
left join public.relationship_profiles rp on rp.user_id = p.id
left join lateral (
  select *
  from public.partner_invitations inv
  where inv.inviter_id = p.id or inv.invitee_id = p.id
  order by inv.created_at desc
  limit 1
) pi on true
order by p.created_at desc;
