-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 008: Complete RLS Policies (Task 4)
--
-- Covers:
--   1. users          — owner read/write; parent can read linked child row
--   2. Public read-only tables — already set in 001, this is idempotent
--   3. User data tables — owner read/write only (server uses service role key)
--   4. leaderboard    — public read, no client write
--   5. parent_child_links — parent or child read; parent insert; parent delete (unlink)
--   6. transcription_logs — owner insert/read (created by speech API)
--
-- NOTE: All server-side writes (XP awards, badge grants, leaderboard rank
--       computation) use the Supabase service role key which bypasses RLS.
--       Client-side JWT (anon/authenticated role) is subject to all policies below.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 1. DROP EXISTING POLICIES THAT WILL BE REPLACED ─────────────────────────
-- (idempotent: drop if exists before recreating with correct definitions)

drop policy if exists "users owner read"           on public.users;
drop policy if exists "users owner insert"         on public.users;
drop policy if exists "users owner update"         on public.users;
drop policy if exists "parent_child_links read"    on public.parent_child_links;
drop policy if exists "parent_child_links insert"  on public.parent_child_links;
drop policy if exists "public read leaderboard"    on public.leaderboard;
drop policy if exists "xp_transactions owner read" on public.xp_transactions;
drop policy if exists "user_badges owner read"     on public.user_badges;

-- ─── 2. USERS TABLE ──────────────────────────────────────────────────────────

-- Owner can read their own row
create policy "users owner select"
  on public.users for select
  using (auth.uid() = id);

-- Parent can read their linked child's row (for parent dashboard)
create policy "users parent read child"
  on public.users for select
  using (
    exists (
      select 1 from public.parent_child_links
      where parent_id = auth.uid() and child_id = public.users.id
    )
  );

-- Only the authenticated user can insert their own row (triggered on signup)
create policy "users owner insert"
  on public.users for insert
  with check (auth.uid() = id);

-- Only the owner can update their own row
create policy "users owner update"
  on public.users for update
  using (auth.uid() = id);

-- No client-side deletes; account deletion handled server-side via service role
-- (cascade delete on auth.users handles cleanup)

-- ─── 3. PUBLIC READ-ONLY TABLES ──────────────────────────────────────────────
-- Already created in 001_initial_schema.sql — recreate idempotently

do $$ begin
  -- lessons
  if not exists (select 1 from pg_policies where tablename = 'lessons' and policyname = 'public read lessons') then
    create policy "public read lessons" on public.lessons for select using (true);
  end if;
  -- phrases
  if not exists (select 1 from pg_policies where tablename = 'phrases' and policyname = 'public read phrases') then
    create policy "public read phrases" on public.phrases for select using (true);
  end if;
  -- quiz_questions
  if not exists (select 1 from pg_policies where tablename = 'quiz_questions' and policyname = 'public read quiz_questions') then
    create policy "public read quiz_questions" on public.quiz_questions for select using (true);
  end if;
  -- writing_characters
  if not exists (select 1 from pg_policies where tablename = 'writing_characters' and policyname = 'public read writing_characters') then
    create policy "public read writing_characters" on public.writing_characters for select using (true);
  end if;
  -- writing_lessons
  if not exists (select 1 from pg_policies where tablename = 'writing_lessons' and policyname = 'public read writing_lessons') then
    create policy "public read writing_lessons" on public.writing_lessons for select using (true);
  end if;
  -- reading_passages
  if not exists (select 1 from pg_policies where tablename = 'reading_passages' and policyname = 'public read reading_passages') then
    create policy "public read reading_passages" on public.reading_passages for select using (true);
  end if;
  -- reading_vocab
  if not exists (select 1 from pg_policies where tablename = 'reading_vocab' and policyname = 'public read reading_vocab') then
    create policy "public read reading_vocab" on public.reading_vocab for select using (true);
  end if;
  -- reading_questions
  if not exists (select 1 from pg_policies where tablename = 'reading_questions' and policyname = 'public read reading_questions') then
    create policy "public read reading_questions" on public.reading_questions for select using (true);
  end if;
  -- badges
  if not exists (select 1 from pg_policies where tablename = 'badges' and policyname = 'public read badges') then
    create policy "public read badges" on public.badges for select using (true);
  end if;
  -- avatar_items
  if not exists (select 1 from pg_policies where tablename = 'avatar_items' and policyname = 'public read avatar_items') then
    create policy "public read avatar_items" on public.avatar_items for select using (true);
  end if;
  -- mini_games
  if not exists (select 1 from pg_policies where tablename = 'mini_games' and policyname = 'public read mini_games') then
    create policy "public read mini_games" on public.mini_games for select using (true);
  end if;
  -- daily_challenges
  if not exists (select 1 from pg_policies where tablename = 'daily_challenges' and policyname = 'public read daily_challenges') then
    create policy "public read daily_challenges" on public.daily_challenges for select using (true);
  end if;
  -- fun_facts
  if not exists (select 1 from pg_policies where tablename = 'fun_facts' and policyname = 'public read fun_facts') then
    create policy "public read fun_facts" on public.fun_facts for select using (true);
  end if;
  -- fact_of_the_day
  if not exists (select 1 from pg_policies where tablename = 'fact_of_the_day' and policyname = 'public read fact_of_the_day') then
    create policy "public read fact_of_the_day" on public.fact_of_the_day for select using (true);
  end if;
  -- journey_routes
  if not exists (select 1 from pg_policies where tablename = 'journey_routes' and policyname = 'public read journey_routes') then
    create policy "public read journey_routes" on public.journey_routes for select using (true);
  end if;
  -- story_chapters
  if not exists (select 1 from pg_policies where tablename = 'story_chapters' and policyname = 'public read story_chapters') then
    create policy "public read story_chapters" on public.story_chapters for select using (true);
  end if;
  -- story_scenes
  if not exists (select 1 from pg_policies where tablename = 'story_scenes' and policyname = 'public read story_scenes') then
    create policy "public read story_scenes" on public.story_scenes for select using (true);
  end if;
end $$;

-- ─── 4. LEADERBOARD — public read, no client write ───────────────────────────
-- Leaderboard rows are written only by the GitHub Actions cron via service role.
-- Clients can read all rows (opt-in privacy enforced at API layer per Req 9.5).

drop policy if exists "public read leaderboard" on public.leaderboard;
create policy "leaderboard public select"
  on public.leaderboard for select
  using (true);

-- Explicitly block all client-side writes (insert/update/delete)
-- Service role bypasses RLS so the cron job can still write.
create policy "leaderboard no client insert"
  on public.leaderboard for insert
  with check (false);

create policy "leaderboard no client update"
  on public.leaderboard for update
  using (false);

create policy "leaderboard no client delete"
  on public.leaderboard for delete
  using (false);

-- ─── 5. USER DATA TABLES — owner read/write only ─────────────────────────────

-- lesson_progress (already set in 001 as FOR ALL — keep idempotent)
drop policy if exists "lesson_progress owner" on public.lesson_progress;
create policy "lesson_progress owner"
  on public.lesson_progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- xp_transactions: client can read own; server (service role) writes
create policy "xp_transactions owner select"
  on public.xp_transactions for select
  using (auth.uid() = user_id);

-- Prevent client-side XP self-award; all inserts go through Vercel API (service role)
create policy "xp_transactions no client insert"
  on public.xp_transactions for insert
  with check (false);

-- user_badges: client can read own; server (service role) writes on badge evaluation
create policy "user_badges owner select"
  on public.user_badges for select
  using (auth.uid() = user_id);

create policy "user_badges no client insert"
  on public.user_badges for insert
  with check (false);

-- quiz_attempts
drop policy if exists "quiz_attempts owner" on public.quiz_attempts;
create policy "quiz_attempts owner"
  on public.quiz_attempts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- writing_progress
drop policy if exists "writing_progress owner" on public.writing_progress;
create policy "writing_progress owner"
  on public.writing_progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- reading_progress
drop policy if exists "reading_progress owner" on public.reading_progress;
create policy "reading_progress owner"
  on public.reading_progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- story_progress
drop policy if exists "story_progress owner" on public.story_progress;
create policy "story_progress owner"
  on public.story_progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- journey_progress
drop policy if exists "journey_progress owner" on public.journey_progress;
create policy "journey_progress owner"
  on public.journey_progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- challenge_completions
drop policy if exists "challenge_completions owner" on public.challenge_completions;
create policy "challenge_completions owner"
  on public.challenge_completions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- favorite_facts
drop policy if exists "favorite_facts owner" on public.favorite_facts;
create policy "favorite_facts owner"
  on public.favorite_facts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- notification_preferences
drop policy if exists "notification_preferences owner" on public.notification_preferences;
create policy "notification_preferences owner"
  on public.notification_preferences for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── 6. PARENT-CHILD LINKS ───────────────────────────────────────────────────

-- Parent or child can read their own link rows
create policy "parent_child_links select"
  on public.parent_child_links for select
  using (auth.uid() = parent_id or auth.uid() = child_id);

-- Only the parent can create a link
create policy "parent_child_links insert"
  on public.parent_child_links for insert
  with check (auth.uid() = parent_id);

-- Only the parent can unlink (delete) — satisfies Req 9.7
create policy "parent_child_links delete"
  on public.parent_child_links for delete
  using (auth.uid() = parent_id);

-- ─── 7. TRANSCRIPTION LOGS ───────────────────────────────────────────────────
-- Created by the speech API (server, service role) but users can read their own logs.

create table if not exists public.transcription_logs (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references public.users(id) on delete cascade,
  provider         text not null check (provider in ('huggingface', 'google', 'web')),
  confidence       numeric,
  processing_time_ms integer,
  created_at       timestamptz default now()
);

create index if not exists transcription_logs_user_id_idx
  on public.transcription_logs(user_id, created_at desc);

alter table public.transcription_logs enable row level security;

create policy "transcription_logs owner select"
  on public.transcription_logs for select
  using (auth.uid() = user_id);

-- Server (service role) handles inserts; block client writes
create policy "transcription_logs no client insert"
  on public.transcription_logs for insert
  with check (false);
