-- ─────────────────────────────────────────────────────────────────────────────
-- Marathi Learning App — Initial Schema
-- Run this in Supabase SQL Editor (Project → SQL Editor → New Query)
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── STATIC CONTENT TABLES (public read, no client write) ────────────────────

create table public.lessons (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  title_marathi text not null,
  level text not null check (level in ('beginner', 'intermediate', 'advanced')),
  topic text not null,
  order_index integer not null,
  estimated_minutes integer not null default 10,
  xp_reward integer not null default 50,
  associated_trivia_id uuid,
  reading_passage_id uuid,
  mini_game_id uuid,
  writing_character_ids uuid[] default '{}',
  created_at timestamptz default now()
);

create table public.phrases (
  id uuid primary key default uuid_generate_v4(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  marathi_text text not null,
  transliteration text not null,
  english_meaning text not null,
  audio_url text,
  order_index integer not null
);

create table public.quiz_questions (
  id uuid primary key default uuid_generate_v4(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  type text not null check (type in ('multiple_choice', 'fill_blank', 'match_pair', 'speak_answer')),
  question_text text not null,
  question_marathi text,
  options jsonb default '[]',
  correct_answer text not null,
  audio_url text,
  order_index integer not null
);

create table public.writing_characters (
  id uuid primary key default uuid_generate_v4(),
  character text not null,
  type text not null check (type in ('vowel', 'consonant', 'conjunct')),
  transliteration text not null,
  stroke_data jsonb not null default '[]',
  audio_url text,
  lesson_id uuid references public.lessons(id),
  level text not null check (level in ('beginner', 'intermediate', 'advanced')),
  order_index integer not null
);

create table public.writing_lessons (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  level text not null check (level in ('beginner', 'intermediate', 'advanced')),
  type text not null check (type in ('characters', 'words', 'sentences')),
  content jsonb not null default '[]',
  order_index integer not null,
  estimated_minutes integer not null default 10
);

create table public.reading_passages (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  title_marathi text not null,
  lesson_id uuid references public.lessons(id),
  level text not null check (level in ('beginner', 'intermediate', 'advanced')),
  type text not null check (type in ('words', 'sentences', 'paragraph', 'story')),
  content_marathi text not null,
  content_transliteration text not null,
  content_english text not null,
  audio_url text,
  word_count integer not null default 0,
  order_index integer not null,
  estimated_minutes integer not null default 5
);

create table public.reading_vocab (
  id uuid primary key default uuid_generate_v4(),
  passage_id uuid not null references public.reading_passages(id) on delete cascade,
  word_marathi text not null,
  transliteration text not null,
  meaning_english text not null,
  audio_url text,
  position_in_text integer not null
);

create table public.reading_questions (
  id uuid primary key default uuid_generate_v4(),
  passage_id uuid not null references public.reading_passages(id) on delete cascade,
  type text not null check (type in ('multiple_choice', 'true_false', 'short_answer')),
  question_text text not null,
  options jsonb default '[]',
  correct_answer text not null,
  order_index integer not null
);

create table public.badges (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text not null,
  icon_url text,
  criteria jsonb not null default '{}',
  xp_reward integer not null default 0
);

create table public.avatar_items (
  id uuid primary key default uuid_generate_v4(),
  category text not null check (category in ('hair', 'outfit', 'accessory', 'background')),
  name text not null,
  image_url text,
  xp_cost integer not null default 0,
  level_required integer not null default 1
);

create table public.mini_games (
  id uuid primary key default uuid_generate_v4(),
  type text not null check (type in ('word_scramble', 'phrase_builder', 'audio_matching', 'rapid_fire', 'reading_speed_race', 'character_tracing_race')),
  lesson_id uuid references public.lessons(id),
  level text not null check (level in ('beginner', 'intermediate', 'advanced')),
  config jsonb not null default '{}',
  xp_reward integer not null default 20
);

create table public.daily_challenges (
  id uuid primary key default uuid_generate_v4(),
  date date not null unique,
  title text not null,
  description text not null,
  challenge_type text not null check (challenge_type in ('quiz', 'speaking', 'writing', 'reading', 'mini_game')),
  config jsonb not null default '{}',
  xp_reward integer not null default 40,
  created_at timestamptz default now()
);

create table public.fun_facts (
  id uuid primary key default uuid_generate_v4(),
  category text not null check (category in ('history', 'literature', 'culture', 'food', 'nature', 'festivals')),
  content_english text not null,
  content_marathi text not null,
  content_transliteration text not null,
  related_vocabulary jsonb not null default '[]',
  image_url text,
  source text
);

create table public.fact_of_the_day (
  id uuid primary key default uuid_generate_v4(),
  date date not null unique,
  fact_id uuid not null references public.fun_facts(id)
);

create table public.journey_routes (
  id uuid primary key default uuid_generate_v4(),
  start_city text not null,
  start_city_marathi text not null,
  target_city text not null default 'Pune',
  description text not null,
  distance_km integer not null,
  checkpoints jsonb not null default '[]',
  total_xp_required integer not null default 5000
);

create table public.story_chapters (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  title_marathi text not null,
  description text not null,
  order_index integer not null,
  character_name text not null,
  character_image_url text,
  required_level integer not null default 1
);

create table public.story_scenes (
  id uuid primary key default uuid_generate_v4(),
  chapter_id uuid not null references public.story_chapters(id) on delete cascade,
  narrative_text text not null,
  narrative_marathi text not null,
  scene_type text not null check (scene_type in ('dialogue', 'read_sign', 'write_note', 'mixed')),
  dialogue_options jsonb default '[]',
  reading_content text,
  writing_prompt text,
  correct_option_index integer,
  order_index integer not null,
  xp_reward integer not null default 10
);

-- ─── USER DATA TABLES ─────────────────────────────────────────────────────────

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text not null default '',
  avatar_url text,
  google_id text unique,
  age integer not null default 0,
  under_13 boolean not null default false,
  role text not null default 'learner' check (role in ('learner', 'parent')),
  parent_id uuid references public.users(id),
  total_xp integer not null default 0,
  level integer not null default 1,
  level_title text not null default 'Beginner',
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_activity_date timestamptz,
  streak_freeze_available boolean not null default true,
  streak_freeze_used_at timestamptz,
  equipped_items text[] default '{}',
  unlocked_items text[] default '{}',
  notification_streak_reminders boolean not null default true,
  notification_daily_challenge boolean not null default true,
  notification_fact_of_day boolean not null default true,
  notification_preferred_time text default '19:00',
  notification_timezone text default 'Europe/London',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.lesson_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
  score integer not null default 0,
  xp_earned integer not null default 0,
  completed_at timestamptz,
  updated_at timestamptz default now(),
  unique(user_id, lesson_id)
);

create table public.xp_transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  xp_amount integer not null check (xp_amount > 0),
  source text not null check (source in ('lesson', 'quiz', 'speaking', 'writing', 'reading', 'daily_challenge', 'streak_bonus', 'fact_quiz', 'mini_game', 'badge', 'avatar_unlock')),
  reference_id text unique,
  created_at timestamptz default now()
);

create table public.user_badges (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  earned_at timestamptz default now(),
  unique(user_id, badge_id)
);

create table public.quiz_attempts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  answer_given text not null,
  is_correct boolean not null,
  time_taken_ms integer,
  xp_earned integer not null default 0,
  attempted_at timestamptz default now()
);

create table public.writing_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  character_id uuid references public.writing_characters(id) on delete cascade,
  accuracy_score integer not null default 0,
  attempts integer not null default 0,
  mastered boolean not null default false,
  last_practiced_at timestamptz default now(),
  unique(user_id, character_id)
);

create table public.reading_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  passage_id uuid not null references public.reading_passages(id) on delete cascade,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
  comprehension_score integer not null default 0,
  reading_speed_wpm integer not null default 0,
  read_aloud_score integer not null default 0,
  xp_earned integer not null default 0,
  completed_at timestamptz,
  unique(user_id, passage_id)
);

create table public.story_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  chapter_id uuid not null references public.story_chapters(id) on delete cascade,
  current_scene_id uuid references public.story_scenes(id),
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  completed_at timestamptz,
  updated_at timestamptz default now(),
  unique(user_id, chapter_id)
);

create table public.journey_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  route_id uuid not null references public.journey_routes(id) on delete cascade,
  start_city text not null,
  current_checkpoint_index integer not null default 0,
  completed_checkpoints text[] default '{}',
  current_position jsonb not null default '{"x": 0, "y": 0}',
  total_xp_earned integer not null default 0,
  progress_percentage numeric not null default 0,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  started_at timestamptz default now(),
  completed_at timestamptz,
  updated_at timestamptz default now(),
  unique(user_id, route_id)
);

create table public.challenge_completions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  challenge_id uuid not null references public.daily_challenges(id) on delete cascade,
  score integer not null default 0,
  xp_earned integer not null default 0,
  completed_at timestamptz default now(),
  unique(user_id, challenge_id)
);

create table public.favorite_facts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  fact_id uuid not null references public.fun_facts(id) on delete cascade,
  saved_at timestamptz default now(),
  unique(user_id, fact_id)
);

create table public.leaderboard (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  week_start date not null,
  weekly_xp integer not null default 0,
  rank integer not null default 0,
  unique(user_id, week_start)
);

create table public.parent_child_links (
  id uuid primary key default uuid_generate_v4(),
  parent_id uuid not null references public.users(id) on delete cascade,
  child_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(parent_id, child_id)
);

create table public.notification_preferences (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade unique,
  device_tokens text[] default '{}',
  streak_reminders boolean not null default true,
  daily_challenge_alerts boolean not null default true,
  fact_of_the_day boolean not null default true,
  preferred_time text default '19:00',
  timezone text default 'Europe/London'
);

-- ─── INDEXES ──────────────────────────────────────────────────────────────────

create index on public.lessons(level, order_index);
create index on public.phrases(lesson_id);
create index on public.quiz_questions(lesson_id);
create index on public.writing_characters(level, order_index);
create index on public.reading_passages(level, order_index);
create index on public.lesson_progress(user_id, status);
create index on public.lesson_progress(user_id, completed_at desc);
create index on public.xp_transactions(user_id, created_at desc);
create index on public.user_badges(user_id, earned_at desc);
create index on public.writing_progress(user_id, mastered);
create index on public.reading_progress(user_id, status);
create index on public.journey_progress(user_id, status);
create index on public.leaderboard(week_start desc, rank asc);
create index on public.daily_challenges(date);
create index on public.fact_of_the_day(date);

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────

alter table public.users enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.xp_transactions enable row level security;
alter table public.user_badges enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.writing_progress enable row level security;
alter table public.reading_progress enable row level security;
alter table public.story_progress enable row level security;
alter table public.journey_progress enable row level security;
alter table public.challenge_completions enable row level security;
alter table public.favorite_facts enable row level security;
alter table public.leaderboard enable row level security;
alter table public.parent_child_links enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.lessons enable row level security;
alter table public.phrases enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.writing_characters enable row level security;
alter table public.writing_lessons enable row level security;
alter table public.reading_passages enable row level security;
alter table public.reading_vocab enable row level security;
alter table public.reading_questions enable row level security;
alter table public.badges enable row level security;
alter table public.avatar_items enable row level security;
alter table public.mini_games enable row level security;
alter table public.daily_challenges enable row level security;
alter table public.fun_facts enable row level security;
alter table public.fact_of_the_day enable row level security;
alter table public.journey_routes enable row level security;
alter table public.story_chapters enable row level security;
alter table public.story_scenes enable row level security;

-- Public read-only content (no auth required)
create policy "public read lessons" on public.lessons for select using (true);
create policy "public read phrases" on public.phrases for select using (true);
create policy "public read quiz_questions" on public.quiz_questions for select using (true);
create policy "public read writing_characters" on public.writing_characters for select using (true);
create policy "public read writing_lessons" on public.writing_lessons for select using (true);
create policy "public read reading_passages" on public.reading_passages for select using (true);
create policy "public read reading_vocab" on public.reading_vocab for select using (true);
create policy "public read reading_questions" on public.reading_questions for select using (true);
create policy "public read badges" on public.badges for select using (true);
create policy "public read avatar_items" on public.avatar_items for select using (true);
create policy "public read mini_games" on public.mini_games for select using (true);
create policy "public read daily_challenges" on public.daily_challenges for select using (true);
create policy "public read fun_facts" on public.fun_facts for select using (true);
create policy "public read fact_of_the_day" on public.fact_of_the_day for select using (true);
create policy "public read journey_routes" on public.journey_routes for select using (true);
create policy "public read story_chapters" on public.story_chapters for select using (true);
create policy "public read story_scenes" on public.story_scenes for select using (true);
create policy "public read leaderboard" on public.leaderboard for select using (true);

-- Users: owner read/write; parent can read child row
create policy "users owner read" on public.users for select
  using (auth.uid() = id or exists (
    select 1 from public.parent_child_links
    where parent_id = auth.uid() and child_id = id
  ));
create policy "users owner insert" on public.users for insert with check (auth.uid() = id);
create policy "users owner update" on public.users for update using (auth.uid() = id);

-- User data tables: owner only
create policy "lesson_progress owner" on public.lesson_progress for all using (auth.uid() = user_id);
create policy "xp_transactions owner read" on public.xp_transactions for select using (auth.uid() = user_id);
create policy "user_badges owner read" on public.user_badges for select using (auth.uid() = user_id);
create policy "quiz_attempts owner" on public.quiz_attempts for all using (auth.uid() = user_id);
create policy "writing_progress owner" on public.writing_progress for all using (auth.uid() = user_id);
create policy "reading_progress owner" on public.reading_progress for all using (auth.uid() = user_id);
create policy "story_progress owner" on public.story_progress for all using (auth.uid() = user_id);
create policy "journey_progress owner" on public.journey_progress for all using (auth.uid() = user_id);
create policy "challenge_completions owner" on public.challenge_completions for all using (auth.uid() = user_id);
create policy "favorite_facts owner" on public.favorite_facts for all using (auth.uid() = user_id);
create policy "notification_preferences owner" on public.notification_preferences for all using (auth.uid() = user_id);

-- Parent-child links: parent or child can read their own links
create policy "parent_child_links read" on public.parent_child_links for select
  using (auth.uid() = parent_id or auth.uid() = child_id);
create policy "parent_child_links insert" on public.parent_child_links for insert
  with check (auth.uid() = parent_id);

-- ─── AUTO-CREATE USER ROW ON SIGNUP ──────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.users (id, name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', null)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── AUTO-UPDATE updated_at ───────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_users_updated_at before update on public.users
  for each row execute procedure public.set_updated_at();
create trigger set_journey_progress_updated_at before update on public.journey_progress
  for each row execute procedure public.set_updated_at();
create trigger set_story_progress_updated_at before update on public.story_progress
  for each row execute procedure public.set_updated_at();
create trigger set_lesson_progress_updated_at before update on public.lesson_progress
  for each row execute procedure public.set_updated_at();
