import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClient, getUserId } from '../../_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const userId = await getUserId(req);
    const { totalXp, level } = req.body as { totalXp: number; level: number };

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
        if (badge.xp_reward > 0) {
          await adminClient.from('users')
            .update({ total_xp: totalXp + badge.xp_reward })
            .eq('id', userId);
        }
        newlyEarned.push(badge.id);
      }
    }

    return res.status(200).json({ newlyEarned });
  } catch (err: any) {
    const status = err.message?.includes('token') ? 401 : 500;
    return res.status(status).json({ error: err.message });
  }
}
