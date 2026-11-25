import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClient, getUserId } from '../_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const parentId = await getUserId(req);
    const { childId } = req.query as Record<string, string>;
    if (!childId) return res.status(400).json({ error: 'childId required' });

    // Verify the parent-child link exists
    const { data: link } = await adminClient
      .from('parent_child_links')
      .select('child_id')
      .eq('parent_id', parentId)
      .eq('child_id', childId)
      .maybeSingle();

    if (!link) return res.status(403).json({ error: 'Not authorised to view this child' });

    const [
      { data: user },
      { count: lessonsCompleted },
      { count: charactersMastered },
      { data: readingRows },
      { data: streakData },
      { data: badges },
    ] = await Promise.all([
      adminClient.from('users')
        .select('total_xp, level, level_title, current_streak, longest_streak, activity_dates')
        .eq('id', childId).single(),
      adminClient.from('lesson_progress')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', childId).eq('status', 'completed'),
      adminClient.from('writing_progress')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', childId).eq('mastered', true),
      adminClient.from('reading_progress')
        .select('comprehension_score, reading_speed_wpm')
        .eq('user_id', childId),
      adminClient.from('users')
        .select('current_streak, longest_streak, activity_dates')
        .eq('id', childId).single(),
      adminClient.from('user_badges')
        .select('badge_id, earned_at, badges(name, description, icon)')
        .eq('user_id', childId),
    ]);

    const avgComprehension = readingRows?.length
      ? Math.round(readingRows.reduce((s, r) => s + (r.comprehension_score ?? 0), 0) / readingRows.length)
      : 0;
    const avgWpm = readingRows?.length
      ? Math.round(readingRows.reduce((s, r) => s + (r.reading_speed_wpm ?? 0), 0) / readingRows.length)
      : 0;

    return res.status(200).json({
      totalXp: user?.total_xp ?? 0,
      level: user?.level ?? 1,
      levelTitle: user?.level_title ?? 'Beginner',
      lessonsCompleted: lessonsCompleted ?? 0,
      charactersMastered: charactersMastered ?? 0,
      avgComprehension,
      avgWpm,
      streak: {
        currentStreak: streakData?.current_streak ?? 0,
        longestStreak: streakData?.longest_streak ?? 0,
        activityDates: streakData?.activity_dates ?? [],
      },
      badges: (badges ?? []).map((b: any) => ({
        id: b.badge_id,
        name: b.badges?.name,
        icon: b.badges?.icon,
        description: b.badges?.description,
        earned: true,
        earnedAt: b.earned_at,
      })),
    });
  } catch (err: any) {
    const status = err.message?.includes('token') ? 401 : 500;
    return res.status(status).json({ error: err.message });
  }
}
