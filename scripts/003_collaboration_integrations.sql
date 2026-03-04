-- Collaboration and integrations tables used across dashboard modules

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  owner_id uuid not null references auth.users(id) on delete cascade,
  invite_code text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(team_id, user_id)
);

create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  access_token text,
  refresh_token text,
  expires_at bigint,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, provider)
);

alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.integrations enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'teams' and policyname = 'teams_select_member'
  ) then
    create policy "teams_select_member"
      on public.teams
      for select
      using (
        owner_id = auth.uid()
        or exists (
          select 1
          from public.team_members tm
          where tm.team_id = teams.id
            and tm.user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'teams' and policyname = 'teams_insert_owner'
  ) then
    create policy "teams_insert_owner"
      on public.teams
      for insert
      with check (owner_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'teams' and policyname = 'teams_update_owner'
  ) then
    create policy "teams_update_owner"
      on public.teams
      for update
      using (owner_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'team_members' and policyname = 'team_members_select_visible'
  ) then
    create policy "team_members_select_visible"
      on public.team_members
      for select
      using (
        user_id = auth.uid()
        or exists (
          select 1
          from public.team_members tm
          where tm.team_id = team_members.team_id
            and tm.user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'team_members' and policyname = 'team_members_insert_admin'
  ) then
    create policy "team_members_insert_admin"
      on public.team_members
      for insert
      with check (
        exists (
          select 1
          from public.teams t
          where t.id = team_members.team_id
            and t.owner_id = auth.uid()
        )
        or exists (
          select 1
          from public.team_members tm
          where tm.team_id = team_members.team_id
            and tm.user_id = auth.uid()
            and tm.role in ('owner', 'admin')
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'team_members' and policyname = 'team_members_update_admin'
  ) then
    create policy "team_members_update_admin"
      on public.team_members
      for update
      using (
        exists (
          select 1
          from public.team_members tm
          where tm.team_id = team_members.team_id
            and tm.user_id = auth.uid()
            and tm.role in ('owner', 'admin')
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'team_members' and policyname = 'team_members_delete_admin'
  ) then
    create policy "team_members_delete_admin"
      on public.team_members
      for delete
      using (
        user_id = auth.uid()
        or exists (
          select 1
          from public.team_members tm
          where tm.team_id = team_members.team_id
            and tm.user_id = auth.uid()
            and tm.role in ('owner', 'admin')
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'integrations' and policyname = 'integrations_select_own'
  ) then
    create policy "integrations_select_own"
      on public.integrations
      for select
      using (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'integrations' and policyname = 'integrations_insert_own'
  ) then
    create policy "integrations_insert_own"
      on public.integrations
      for insert
      with check (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'integrations' and policyname = 'integrations_update_own'
  ) then
    create policy "integrations_update_own"
      on public.integrations
      for update
      using (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'integrations' and policyname = 'integrations_delete_own'
  ) then
    create policy "integrations_delete_own"
      on public.integrations
      for delete
      using (user_id = auth.uid());
  end if;
end $$;

alter table if exists public.tasks
  add column if not exists team_id uuid references public.teams(id) on delete set null,
  add column if not exists assignee_id uuid references public.profiles(id) on delete set null;

create index if not exists idx_teams_owner_id on public.teams(owner_id);
create index if not exists idx_team_members_team_id on public.team_members(team_id);
create index if not exists idx_team_members_user_id on public.team_members(user_id);
create index if not exists idx_integrations_user_id on public.integrations(user_id);
create index if not exists idx_tasks_team_id on public.tasks(team_id);
