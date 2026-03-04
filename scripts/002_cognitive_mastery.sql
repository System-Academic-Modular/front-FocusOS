-- Cognitive load per task
alter table if exists public.tasks
  add column if not exists cognitive_load integer not null default 3;

update public.tasks
set cognitive_load = 3
where cognitive_load is null
   or cognitive_load < 1
   or cognitive_load > 5;

alter table if exists public.tasks
  alter column cognitive_load set default 3,
  alter column cognitive_load set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tasks_cognitive_load_check'
      and conrelid = 'public.tasks'::regclass
  ) then
    alter table public.tasks
      add constraint tasks_cognitive_load_check
      check (cognitive_load between 1 and 5);
  end if;
end $$;

create index if not exists idx_tasks_cognitive_load on public.tasks(cognitive_load);

-- Mastery engine
create table if not exists public.mastery_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  score numeric(5,2) not null default 0 check (score >= 0 and score <= 100),
  total_minutes integer not null default 0,
  last_session_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, category_id)
);

alter table if exists public.mastery_scores
  add column if not exists total_minutes integer not null default 0,
  add column if not exists last_session_at timestamp with time zone;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'mastery_scores_score_check'
      and conrelid = 'public.mastery_scores'::regclass
  ) then
    alter table public.mastery_scores
      add constraint mastery_scores_score_check
      check (score >= 0 and score <= 100);
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'mastery_scores'
      and column_name = 'last_study_date'
  ) then
    execute '
      update public.mastery_scores
      set last_session_at = coalesce(last_session_at, last_study_date)
      where last_study_date is not null
    ';
  end if;
end $$;

alter table public.mastery_scores enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'mastery_scores'
      and policyname = 'mastery_scores_select_own'
  ) then
    create policy "mastery_scores_select_own"
      on public.mastery_scores
      for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'mastery_scores'
      and policyname = 'mastery_scores_insert_own'
  ) then
    create policy "mastery_scores_insert_own"
      on public.mastery_scores
      for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'mastery_scores'
      and policyname = 'mastery_scores_update_own'
  ) then
    create policy "mastery_scores_update_own"
      on public.mastery_scores
      for update
      using (auth.uid() = user_id);
  end if;
end $$;

create index if not exists idx_mastery_scores_user_id on public.mastery_scores(user_id);
create index if not exists idx_mastery_scores_last_session on public.mastery_scores(last_session_at desc);

create or replace function public.bump_mastery_score_from_pomodoro()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  task_category_id uuid;
  task_cognitive_load integer;
  mastery_increment numeric(6,2);
begin
  if new.type <> 'work' or new.task_id is null then
    return new;
  end if;

  select category_id, cognitive_load
    into task_category_id, task_cognitive_load
  from public.tasks
  where id = new.task_id
    and user_id = new.user_id
  limit 1;

  if task_category_id is null then
    return new;
  end if;

  mastery_increment := greatest(
    1.00,
    (coalesce(new.duration_minutes, 25)::numeric / 5.00) * (coalesce(task_cognitive_load, 3)::numeric / 3.00)
  );

  insert into public.mastery_scores (
    user_id,
    category_id,
    score,
    total_minutes,
    last_session_at,
    created_at,
    updated_at
  )
  values (
    new.user_id,
    task_category_id,
    least(100.00, mastery_increment),
    coalesce(new.duration_minutes, 0),
    coalesce(new.completed_at, timezone('utc'::text, now())),
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
  )
  on conflict (user_id, category_id) do update
    set score = least(100.00, public.mastery_scores.score + mastery_increment),
        total_minutes = public.mastery_scores.total_minutes + coalesce(new.duration_minutes, 0),
        last_session_at = coalesce(new.completed_at, timezone('utc'::text, now())),
        updated_at = timezone('utc'::text, now());

  return new;
end;
$$;

drop trigger if exists trg_mastery_score_on_pomodoro on public.pomodoro_sessions;

create trigger trg_mastery_score_on_pomodoro
  after insert on public.pomodoro_sessions
  for each row
  execute function public.bump_mastery_score_from_pomodoro();

drop view if exists public.mastery_status;

create view public.mastery_status as
select
  ms.id,
  ms.user_id,
  ms.category_id,
  ms.score,
  ms.total_minutes,
  ms.last_session_at,
  ms.created_at,
  ms.updated_at,
  c.name as category_name,
  c.color as category_color,
  (
    ms.last_session_at is null
    or ms.last_session_at < timezone('utc'::text, now()) - interval '3 days'
  ) as needs_attention
from public.mastery_scores ms
join public.categories c on c.id = ms.category_id;
