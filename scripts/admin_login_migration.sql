-- ============================================================
-- UGC FY Admin Panel — Full Database Migration
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard)
-- Project: qsvpbzyceapgexugmvoa
-- ============================================================

-- 1. admin_users table
create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  email text not null unique,
  full_name text,
  role text not null default 'admin',
  status text not null default 'invited',
  invited_by uuid references public.admin_users(id),
  invited_at timestamptz default now(),
  accepted_at timestamptz,
  last_login_at timestamptz,
  last_login_ip inet,
  password_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint admin_users_role_check check (
    role in (
      'owner',
      'super_admin',
      'admin',
      'kyc_manager',
      'campaign_manager',
      'moderator',
      'support',
      'finance'
    )
  ),

  constraint admin_users_status_check check (
    status in (
      'invited',
      'active',
      'suspended',
      'revoked'
    )
  )
);

create index if not exists admin_users_email_lower_idx
on public.admin_users (lower(email));

create index if not exists admin_users_user_id_idx
on public.admin_users (user_id);

create index if not exists admin_users_status_idx
on public.admin_users (status);

create index if not exists admin_users_role_idx
on public.admin_users (role);


-- 2. admin_security_events table
create table if not exists public.admin_security_events (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references public.admin_users(id) on delete set null,
  email text,
  ip_address text,
  user_agent text,
  event_type text not null,
  severity text not null default 'info',
  metadata jsonb default '{}',
  created_at timestamptz not null default now(),

  constraint admin_security_events_severity_check check (
    severity in ('info', 'warning', 'critical')
  )
);

create index if not exists admin_security_events_email_idx
on public.admin_security_events (email);

create index if not exists admin_security_events_event_type_idx
on public.admin_security_events (event_type);

create index if not exists admin_security_events_created_at_idx
on public.admin_security_events (created_at desc);

create index if not exists admin_security_events_admin_user_id_idx
on public.admin_security_events (admin_user_id);


-- 3. admin_bans table
create table if not exists public.admin_bans (
  id uuid primary key default gen_random_uuid(),
  ban_type text not null,
  value text not null,
  reason text,
  severity text not null default 'temporary',
  banned_until timestamptz,
  banned_by uuid references public.admin_users(id) on delete set null,
  created_at timestamptz not null default now(),

  constraint admin_bans_ban_type_check check (
    ban_type in ('email', 'ip')
  ),

  constraint admin_bans_severity_check check (
    severity in ('temporary', 'permanent')
  ),

  constraint admin_bans_unique_type_value unique (ban_type, value)
);

create index if not exists admin_bans_ban_type_idx
on public.admin_bans (ban_type);

create index if not exists admin_bans_value_idx
on public.admin_bans (value);


-- 4. Seed the owner account
insert into public.admin_users (
  email,
  full_name,
  role,
  status,
  password_enabled,
  updated_at
)
values (
  'ugcfybycreatornavigator@gmail.com',
  'UGC FY Owner',
  'owner',
  'active',
  false,
  now()
)
on conflict (email)
do update set
  full_name = coalesce(public.admin_users.full_name, 'UGC FY Owner'),
  role = 'owner',
  status = 'active',
  password_enabled = coalesce(public.admin_users.password_enabled, false),
  updated_at = now();


-- 5. Verify the owner was created
select
  id,
  user_id,
  email,
  full_name,
  role,
  status,
  password_enabled,
  created_at,
  updated_at
from public.admin_users
where lower(email) = lower('ugcfybycreatornavigator@gmail.com');
