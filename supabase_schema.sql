-- =============================================
-- Kanban Board — Full Supabase Database Schema
-- Run this in the Supabase SQL Editor
-- =============================================

-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. Tasks table
create table if not exists public.tasks (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  description text,
  status      text not null default 'todo'
                check (status in ('todo', 'in_progress', 'in_review', 'done')),
  priority    text not null default 'normal'
                check (priority in ('low', 'normal', 'high')),
  due_date    date,
  user_id     uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  position    integer not null default 0
);

-- 3. Team members table
create table if not exists public.team_members (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  avatar_url text,
  color      text not null default '#6366f1',
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- 4. Task assignees (many-to-many)
create table if not exists public.task_assignees (
  id             uuid primary key default uuid_generate_v4(),
  task_id        uuid not null references public.tasks(id) on delete cascade,
  team_member_id uuid not null references public.team_members(id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  unique(task_id, team_member_id)
);

-- 5. Labels table
create table if not exists public.labels (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  color      text not null default '#6366f1',
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- 6. Task labels (many-to-many)
create table if not exists public.task_labels (
  id       uuid primary key default uuid_generate_v4(),
  task_id  uuid not null references public.tasks(id) on delete cascade,
  label_id uuid not null references public.labels(id) on delete cascade,
  user_id  uuid not null references auth.users(id) on delete cascade,
  unique(task_id, label_id)
);

-- 7. Comments table
create table if not exists public.comments (
  id         uuid primary key default uuid_generate_v4(),
  task_id    uuid not null references public.tasks(id) on delete cascade,
  content    text not null,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- 8. Activity log table
create table if not exists public.activity_log (
  id         uuid primary key default uuid_generate_v4(),
  task_id    uuid not null references public.tasks(id) on delete cascade,
  action     text not null,
  details    text,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- =============================================
-- Row Level Security (RLS)
-- =============================================

-- Tasks RLS
alter table public.tasks enable row level security;
create policy "Users can view own tasks" on public.tasks for select using (auth.uid() = user_id);
create policy "Users can insert own tasks" on public.tasks for insert with check (auth.uid() = user_id);
create policy "Users can update own tasks" on public.tasks for update using (auth.uid() = user_id);
create policy "Users can delete own tasks" on public.tasks for delete using (auth.uid() = user_id);

-- Team members RLS
alter table public.team_members enable row level security;
create policy "Users can view own team members" on public.team_members for select using (auth.uid() = user_id);
create policy "Users can insert own team members" on public.team_members for insert with check (auth.uid() = user_id);
create policy "Users can update own team members" on public.team_members for update using (auth.uid() = user_id);
create policy "Users can delete own team members" on public.team_members for delete using (auth.uid() = user_id);

-- Task assignees RLS
alter table public.task_assignees enable row level security;
create policy "Users can view own task assignees" on public.task_assignees for select using (auth.uid() = user_id);
create policy "Users can insert own task assignees" on public.task_assignees for insert with check (auth.uid() = user_id);
create policy "Users can delete own task assignees" on public.task_assignees for delete using (auth.uid() = user_id);

-- Labels RLS
alter table public.labels enable row level security;
create policy "Users can view own labels" on public.labels for select using (auth.uid() = user_id);
create policy "Users can insert own labels" on public.labels for insert with check (auth.uid() = user_id);
create policy "Users can update own labels" on public.labels for update using (auth.uid() = user_id);
create policy "Users can delete own labels" on public.labels for delete using (auth.uid() = user_id);

-- Task labels RLS
alter table public.task_labels enable row level security;
create policy "Users can view own task labels" on public.task_labels for select using (auth.uid() = user_id);
create policy "Users can insert own task labels" on public.task_labels for insert with check (auth.uid() = user_id);
create policy "Users can delete own task labels" on public.task_labels for delete using (auth.uid() = user_id);

-- Comments RLS
alter table public.comments enable row level security;
create policy "Users can view own comments" on public.comments for select using (auth.uid() = user_id);
create policy "Users can insert own comments" on public.comments for insert with check (auth.uid() = user_id);
create policy "Users can delete own comments" on public.comments for delete using (auth.uid() = user_id);

-- Activity log RLS
alter table public.activity_log enable row level security;
create policy "Users can view own activity" on public.activity_log for select using (auth.uid() = user_id);
create policy "Users can insert own activity" on public.activity_log for insert with check (auth.uid() = user_id);

-- =============================================
-- Auto-update updated_at trigger
-- =============================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tasks_updated_at
  before update on public.tasks
  for each row execute function update_updated_at();

-- =============================================
-- Indexes for performance
-- =============================================
create index if not exists idx_tasks_user_id on public.tasks(user_id);
create index if not exists idx_tasks_status on public.tasks(status);
create index if not exists idx_comments_task_id on public.comments(task_id);
create index if not exists idx_activity_log_task_id on public.activity_log(task_id);
create index if not exists idx_task_assignees_task_id on public.task_assignees(task_id);
create index if not exists idx_task_labels_task_id on public.task_labels(task_id);
create index if not exists idx_labels_user_id on public.labels(user_id);
create index if not exists idx_team_members_user_id on public.team_members(user_id);
