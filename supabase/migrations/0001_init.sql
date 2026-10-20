-- StudyMentor AI — Supabase / PostgreSQL schema
-- -----------------------------------------------------------------------------
-- The local prototype uses SQLite (server/db.ts) with the same table shapes.
-- This migration is the production path: managed auth, Postgres, and RLS.
--
-- Security model
--   * profiles / study_tasks / attempts / bookmarks / lesson_progress /
--     conversations / messages / answer_submissions are user-owned. Every
--     policy is scoped to auth.uid() and never trusts a client-supplied user id.
--   * subjects / lessons / questions / current_affairs are shared content and
--     readable by authenticated users.
--   * The browser must never hold a service_role key. The Express API (or
--     Supabase Edge Functions) performs privileged work server-side.
--
-- IMPORTANT: questions.correct_answer and questions.explanation are readable by
-- direct database clients under this schema. If you query practice questions
-- directly from the browser, serve them through an Edge Function / API that
-- omits those columns, or add a hardened view and column-level grants.
-- -----------------------------------------------------------------------------

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------- profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 60),
  email text not null unique,
  exam_year integer check (exam_year between 2024 and 2100),
  preparation_level text check (
    preparation_level in ('beginner', 'intermediate', 'advanced', 'working-professional')
  ),
  daily_goal_minutes integer not null default 120 check (daily_goal_minutes between 15 and 720),
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now()
);

-- --------------------------------------------------------------- shared content
create table if not exists public.subjects (
  id text primary key,
  name text not null,
  syllabus_section text not null,
  description text not null,
  accent text not null default 'brand',
  sort_order integer not null default 0
);

create table if not exists public.lessons (
  id text primary key,
  subject_id text not null references public.subjects (id) on delete cascade,
  title text not null,
  summary text not null,
  content text not null,
  objectives jsonb not null default '[]'::jsonb,
  estimated_minutes integer not null default 20 check (estimated_minutes > 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.questions (
  id text primary key,
  subject_id text not null references public.subjects (id) on delete cascade,
  topic text not null,
  exam_year integer,
  question_text text not null,
  options jsonb not null check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) = 4),
  correct_answer smallint not null check (correct_answer between 0 and 3),
  explanation text not null,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  source text not null,
  question_type text not null default 'mcq' check (question_type in ('mcq', 'pyq-style')),
  created_at timestamptz not null default now()
);

create table if not exists public.current_affairs (
  id text primary key,
  title text not null,
  summary text not null,
  content text not null,
  subject_id text not null references public.subjects (id) on delete cascade,
  source_url text not null,
  source_label text not null,
  published_at date not null,
  prelims_facts jsonb not null default '[]'::jsonb,
  mains_relevance text not null default '',
  related_topic text,
  is_demo boolean not null default true,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------- user content
create table if not exists public.study_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id text references public.lessons (id) on delete set null,
  title text not null,
  kind text not null default 'lesson' check (kind in ('lesson', 'practice', 'current-affairs')),
  due_date date not null,
  status text not null default 'pending' check (status in ('pending', 'completed')),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  question_id text not null references public.questions (id) on delete cascade,
  selected_answer smallint not null check (selected_answer between 0 and 3),
  is_correct boolean not null,
  created_at timestamptz not null default now()
);

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  item_type text not null check (item_type in ('lesson', 'question', 'article', 'explanation', 'subject')),
  item_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, item_type, item_id)
);

create table if not exists public.lesson_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id text not null references public.lessons (id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  source_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.answer_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  question_text text not null,
  subject_id text references public.subjects (id) on delete set null,
  answer_text text not null,
  word_count integer not null check (word_count >= 0),
  feedback_json jsonb not null,
  mode text not null default 'demo' check (mode in ('demo', 'live')),
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------ indexes
create index if not exists profiles_email_idx on public.profiles (email);
create index if not exists lessons_subject_idx on public.lessons (subject_id, sort_order);
create index if not exists questions_subject_topic_idx on public.questions (subject_id, topic);
create index if not exists questions_year_idx on public.questions (exam_year);
create index if not exists affairs_published_idx on public.current_affairs (published_at desc);
create index if not exists affairs_subject_idx on public.current_affairs (subject_id);
create index if not exists tasks_user_due_idx on public.study_tasks (user_id, due_date);
create unique index if not exists tasks_user_lesson_due_idx
  on public.study_tasks (user_id, lesson_id, due_date)
  where lesson_id is not null;
create index if not exists attempts_user_created_idx on public.attempts (user_id, created_at desc);
create index if not exists attempts_question_idx on public.attempts (question_id);
create index if not exists bookmarks_user_type_idx on public.bookmarks (user_id, item_type);
create index if not exists conversations_user_updated_idx on public.conversations (user_id, updated_at desc);
create index if not exists messages_conversation_idx on public.messages (conversation_id, created_at);
create index if not exists submissions_user_created_idx on public.answer_submissions (user_id, created_at desc);

-- ------------------------------------------------------- updated_at trigger
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists conversations_touch_updated_at on public.conversations;
create trigger conversations_touch_updated_at
  before update on public.conversations
  for each row execute function public.touch_updated_at();

-- ------------------------------------------- create a profile after signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), split_part(coalesce(new.email, 'Learner'), '@', 1)),
    coalesce(new.email, '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------ enable RLS
alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.lessons enable row level security;
alter table public.questions enable row level security;
alter table public.current_affairs enable row level security;
alter table public.study_tasks enable row level security;
alter table public.attempts enable row level security;
alter table public.bookmarks enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.answer_submissions enable row level security;

-- ----------------------------------------------------------- shared content
create policy "Authenticated users can read subjects"
  on public.subjects for select to authenticated using (true);

create policy "Authenticated users can read lessons"
  on public.lessons for select to authenticated using (true);

create policy "Authenticated users can read current affairs"
  on public.current_affairs for select to authenticated using (true);

create policy "Authenticated users can read questions"
  on public.questions for select to authenticated using (true);

-- ---------------------------------------------------------------- profiles
create policy "Users can read their own profile"
  on public.profiles for select to authenticated using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert to authenticated with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

-- -------------------------------------------------------------- study tasks
create policy "Users manage their own study tasks"
  on public.study_tasks for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ----------------------------------------------------------------- attempts
create policy "Users read their own attempts"
  on public.attempts for select to authenticated using (auth.uid() = user_id);

create policy "Users insert their own attempts"
  on public.attempts for insert to authenticated with check (auth.uid() = user_id);

create policy "Users delete their own attempts"
  on public.attempts for delete to authenticated using (auth.uid() = user_id);

-- ---------------------------------------------------------------- bookmarks
create policy "Users manage their own bookmarks"
  on public.bookmarks for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------- lesson progress
create policy "Users manage their own lesson progress"
  on public.lesson_progress for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ------------------------------------------------------------ conversations
create policy "Users manage their own conversations"
  on public.conversations for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ----------------------------------------------------------------- messages
create policy "Users read messages in their conversations"
  on public.messages for select to authenticated
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id and c.user_id = auth.uid()
    )
  );

create policy "Users insert messages in their conversations"
  on public.messages for insert to authenticated
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id and c.user_id = auth.uid()
    )
  );

create policy "Users delete messages in their conversations"
  on public.messages for delete to authenticated
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id and c.user_id = auth.uid()
    )
  );

-- ------------------------------------------------------- answer submissions
create policy "Users manage their own answer submissions"
  on public.answer_submissions for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Optional hardening for answer visibility
-- ---------------------------------------------------------------------------
-- If practice questions are served directly to the browser through Supabase,
-- prevent the answer and explanation from being selected by non-service roles:
--
--   revoke select on public.questions from authenticated, anon;
--   grant select (id, subject_id, topic, exam_year, question_text, options,
--                 difficulty, source, question_type)
--     on public.questions to authenticated;
--
-- The StudyMentor Express server checks answers server-side, so it uses a
-- privileged connection and is unaffected by these column grants.
