import { adminClient } from './supabase';

const LEVEL_THRESHOLDS = [0, 100, 250, 500, 900, 1400, 2000, 2800, 3800, 5000];
const LEVEL_TITLES = ['Beginner', 'Explorer', 'Speaker', 'Storyteller', 'Champion', 'Master', 'Legend', 'Guru', 'Pandit', 'Marathi Ratna'];

export function computeLevel(totalXp: number): { level: number; levelTitle: string } {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVEL_THRESHOLDS[i]) { level = i + 1; break; }
  }
  return { level, levelTitle: LEVEL_TITLES[level - 1] };
}

/**
 * Evaluate and award any newly-unlocked badges for a user.
 * Called directly (no HTTP) to avoid any SSRF surface.
 */
export async function evaluateBadges(
  userId: string,
  totalXp: number,
  level: number,
): Promise<string[]> {
  const [
    { data: allBadges },
    { data: earnedBadges },
    { data: user },
    { count: lessonsCompleted },
    { count: charactersMastered },
    { count: passagesCompleted },
    { count: journeysCompleted },
  ] = await Promise.all([
    adminClient.from('badges').select('*'),
    adminClient.from('user_badges').select('badge_id').eq('user_id', userId),
    adminClient.from('users').select('current_streak').eq('id', userId).single(),
    adminClient.from('lesson_progress').select('*', { count: 'exact', head: true })
      .eq('user_id', userId).eq('status', 'completed'),
    adminClient.from('writing_progress').select('*', { count: 'exact', head: true })
      .eq('user_id', userId).eq('mastered', true),
    adminClient.from('reading_progress').select('*', { count: 'exact', head: true })
      .eq('user_id', userId).eq('status', 'completed'),
    adminClient.from('journey_progress').select('*', { count: 'exact', head: true })
      .eq('user_id', userId).eq('status', 'completed'),
  ]);

  const earnedIds = new Set((earnedBadges ?? []).map((b) => b.badge_id));
  const streak = user?.current_streak ?? 0;
  const newlyEarned: string[] = [];

  for (const badge of allBadges ?? []) {
    if (earnedIds.has(badge.id)) continue;
    const c = badge.criteria as Record<string, unknown>;
    const met =
      (c.xp_threshold && totalXp >= (c.xp_threshold as number)) ||
      (c.streak_count && streak >= (c.streak_count as number)) ||
      (c.lessons_completed && (lessonsCompleted ?? 0) >= (c.lessons_completed as number)) ||
      (c.characters_mastered && (charactersMastered ?? 0) >= (c.characters_mastered as number)) ||
      (c.passages_completed && (passagesCompleted ?? 0) >= (c.passages_completed as number)) ||
      (c.journey_completed && (journeysCompleted ?? 0) >= 1);

    if (met) {
      await adminClient.from('user_badges').insert({
        user_id: userId, badge_id: badge.id, earned_at: new Date().toISOString(),
      });
      if ((badge.xp_reward ?? 0) > 0) {
        await adminClient.from('users')
          .update({ total_xp: totalXp + badge.xp_reward })
          .eq('id', userId);
      }
      newlyEarned.push(badge.id);
    }
  }

  return newlyEarned;
}

export function isSameDay(a: Date, b: Date): boolean {
  const fmt = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  return fmt(a) === fmt(b);
}

export function isYesterday(a: Date, b: Date): boolean {
  const fmt = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const aDay = new Date(fmt(a)), bDay = new Date(fmt(b));
  return bDay.getTime() - aDay.getTime() === 86400000;
}
