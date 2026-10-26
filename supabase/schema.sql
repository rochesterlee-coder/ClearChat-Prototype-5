-- ClearChat starter schema. Run in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  code text not null unique check (code ~ '^[0-9]{6}$'),
  description text not null default 'A place to talk and plan together.',
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.room_members (
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (room_id,user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  user_name text not null default 'Member',
  content text not null check (char_length(content) between 1 and 5000),
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  title text not null check (char_length(title) between 1 and 120),
  details text not null default '',
  venue text not null,
  starts_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists messages_room_created_idx on public.messages(room_id, created_at);
create index if not exists events_room_starts_idx on public.events(room_id, starts_at);
create index if not exists room_members_user_idx on public.room_members(user_id);

alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.messages enable row level security;
alter table public.events enable row level security;

-- Membership helper avoids recursive RLS policies on room_members.
create or replace function public.is_room_member(target_room uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.room_members rm where rm.room_id=target_room and rm.user_id=auth.uid()); $$;
revoke all on function public.is_room_member(uuid) from public;
grant execute on function public.is_room_member(uuid) to authenticated;

create policy "members can view their rooms" on public.rooms for select to authenticated
using (public.is_room_member(id));
create policy "signed-in users can create rooms" on public.rooms for insert to authenticated
with check (created_by = auth.uid());
create policy "room creator can update room" on public.rooms for update to authenticated
using (created_by = auth.uid()) with check (created_by = auth.uid());

create policy "members can see memberships in their rooms" on public.room_members for select to authenticated
using (public.is_room_member(room_id) or user_id = auth.uid());
create policy "users can join rooms" on public.room_members for insert to authenticated
with check (user_id = auth.uid());
create policy "users can leave rooms" on public.room_members for delete to authenticated
using (user_id = auth.uid());

create policy "room members can read messages" on public.messages for select to authenticated
using (public.is_room_member(room_id));
create policy "room members can send messages" on public.messages for insert to authenticated
with check (public.is_room_member(room_id) and user_id = auth.uid());

create policy "room members can read events" on public.events for select to authenticated
using (public.is_room_member(room_id));
create policy "room members can create events" on public.events for insert to authenticated
with check (public.is_room_member(room_id) and created_by = auth.uid());

-- Enable realtime updates for messages and events.
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null;
when undefined_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.events;
exception when duplicate_object then null;
when undefined_object then null;
end $$;

-- NOTE: A secure production room-code join flow should use a rate-limited server/Edge Function.
-- The starter currently queries room code from the client; do not expose sensitive private data in rooms.
