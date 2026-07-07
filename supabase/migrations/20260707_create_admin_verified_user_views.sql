-- Create operational views for approved creators and brands

create or replace view public.creator_verified_users as
select
  p.id as user_id,
  p.email,
  p.role,
  p.approval_status,
  p.kyc_status,
  p.created_at,
  p.updated_at,
  cp.id as creator_profile_id,
  cp.full_name,
  cp.username
from public.profiles p
left join public.creator_profiles cp
  on cp.user_id = p.id
where lower(p.role::text) = 'creator'
  and (
    lower(coalesce(p.approval_status::text, '')) = 'approved'
    or lower(coalesce(p.kyc_status::text, '')) = 'approved'
  );

create or replace view public.brand_verified_users as
select
  p.id as user_id,
  p.email,
  p.role,
  p.approval_status,
  p.kyc_status,
  p.created_at,
  p.updated_at,
  bp.id as brand_profile_id,
  bp.brand_name,
  bp.contact_email
from public.profiles p
left join public.brand_profiles bp
  on bp.user_id = p.id
where lower(p.role::text) = 'brand'
  and (
    lower(coalesce(p.approval_status::text, '')) = 'approved'
    or lower(coalesce(p.kyc_status::text, '')) = 'approved'
  );

-- Pending user views
create or replace view public.creator_pending_users as
select
  p.id as user_id,
  p.email,
  p.role,
  p.approval_status,
  p.kyc_status,
  p.created_at,
  p.updated_at
from public.profiles p
where lower(p.role::text) = 'creator'
  and (
    lower(coalesce(p.approval_status::text, '')) = 'pending'
    or lower(coalesce(p.kyc_status::text, '')) = 'pending'
    or (p.approval_status is null and p.kyc_status is null)
  );

create or replace view public.brand_pending_users as
select
  p.id as user_id,
  p.email,
  p.role,
  p.approval_status,
  p.kyc_status,
  p.created_at,
  p.updated_at
from public.profiles p
where lower(p.role::text) = 'brand'
  and (
    lower(coalesce(p.approval_status::text, '')) = 'pending'
    or lower(coalesce(p.kyc_status::text, '')) = 'pending'
    or (p.approval_status is null and p.kyc_status is null)
  );
