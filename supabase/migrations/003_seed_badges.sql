-- ─────────────────────────────────────────────────────────────────────────────
-- Seed: badges  (criteria keys match api/gamification/badges/evaluate.ts)
--
-- Evaluator checks:
--   c.xp_threshold        → totalXp >= value
--   c.streak_count        → current_streak >= value
--   c.lessons_completed   → completed lesson_progress rows >= value
--   c.characters_mastered → mastered writing_progress rows >= value
--   c.passages_completed  → completed reading_progress rows >= value
--   c.journey_completed   → any journey_progress row with status='completed'
-- ─────────────────────────────────────────────────────────────────────────────

insert into public.badges (id, name, description, icon_url, xp_reward, criteria)
values
  -- ── Lesson milestones ────────────────────────────────────────────────────
  (
    'b0000001-0000-0000-0000-000000000007',
    'First Lesson',
    'Complete your first lesson',
    null, 50,
    '{"lessons_completed": 1}'
  ),
  (
    'b0000001-0000-0000-0000-000000000008',
    'Beginner Complete',
    'Complete all 10 beginner lessons',
    null, 200,
    '{"lessons_completed": 10}'
  ),
  (
    'b0000001-0000-0000-0000-000000000009',
    'Intermediate Complete',
    'Complete all 20 lessons through intermediate',
    null, 400,
    '{"lessons_completed": 20}'
  ),
  (
    'b0000001-0000-0000-0000-000000000010',
    'Marathi Master',
    'Complete all 30 lessons',
    null, 1000,
    '{"lessons_completed": 30}'
  ),
  -- ── XP milestones ────────────────────────────────────────────────────────
  (
    'b0000001-0000-0000-0000-000000000013',
    'XP Collector',
    'Earn 1 000 total XP',
    null, 100,
    '{"xp_threshold": 1000}'
  ),
  (
    'b0000001-0000-0000-0000-000000000016',
    'XP Hoarder',
    'Earn 5 000 total XP',
    null, 250,
    '{"xp_threshold": 5000}'
  ),
  (
    'b0000001-0000-0000-0000-000000000017',
    'XP Legend',
    'Earn 10 000 total XP',
    null, 500,
    '{"xp_threshold": 10000}'
  ),
  -- ── Streak milestones ────────────────────────────────────────────────────
  (
    'b0000001-0000-0000-0000-000000000011',
    'Streak Starter',
    'Maintain a 3-day streak',
    null, 75,
    '{"streak_count": 3}'
  ),
  (
    'b0000001-0000-0000-0000-000000000012',
    'Streak Master',
    'Maintain a 7-day streak',
    null, 150,
    '{"streak_count": 7}'
  ),
  (
    'b0000001-0000-0000-0000-000000000018',
    'Streak Legend',
    'Maintain a 30-day streak',
    null, 500,
    '{"streak_count": 30}'
  ),
  -- ── Writing milestones ───────────────────────────────────────────────────
  (
    'b0000001-0000-0000-0000-000000000014',
    'Writing Novice',
    'Master 5 writing characters',
    null, 75,
    '{"characters_mastered": 5}'
  ),
  (
    'b0000001-0000-0000-0000-000000000019',
    'Writing Adept',
    'Master 20 writing characters',
    null, 200,
    '{"characters_mastered": 20}'
  ),
  (
    'b0000001-0000-0000-0000-000000000020',
    'Script Scholar',
    'Master all 47 writing characters',
    null, 500,
    '{"characters_mastered": 47}'
  ),
  -- ── Reading milestones ───────────────────────────────────────────────────
  (
    'b0000001-0000-0000-0000-000000000015',
    'Reading Star',
    'Complete 5 reading passages',
    null, 100,
    '{"passages_completed": 5}'
  ),
  (
    'b0000001-0000-0000-0000-000000000021',
    'Avid Reader',
    'Complete 15 reading passages',
    null, 250,
    '{"passages_completed": 15}'
  ),
  -- ── Journey milestone ────────────────────────────────────────────────────
  (
    'b0000001-0000-0000-0000-000000000006',
    'Pune Explorer',
    'Complete a journey all the way to Pune',
    'https://storage.googleapis.com/marathi-learning-app/badges/pune_explorer.png',
    500,
    '{"journey_completed": true}'
  )
on conflict (id) do nothing;
