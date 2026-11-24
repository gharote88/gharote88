import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClient, getUserId } from '../_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const userId = await getUserId(req);

    const [
      { data: user },
      { data: completedLessons, count: lessonsCompleted },
      { data: writingMastered, count: charactersMastered },
      { data: readingRows },
    ] = await Promise.all([
      adminClient.from('users')
        .select('total_xp, level, level_title, current_streak, longest_streak')
        .eq('id', userId).single(),
      adminClient.from('lesson_progress')
        .select('lesson_id', { count: 'exact' })
        .eq('user_id', userId).eq('status', 'completed'),
      adminClient.from('writing_progress')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId).eq('mastered', true),
      adminClient.from('reading_progress')
        .select('comprehension_score, reading_speed_wpm')
        .eq('user_id', userId),
    ]);

    const completedIds = new Set((completedLessons ?? []).map((r) => r.lesson_id));

    const avgComprehension = readingRows?.length
      ? Math.round(readingRows.reduce((s, r) => s + (r.comprehension_score ?? 0), 0) / readingRows.length)
      : 0;
    const avgWpm = readingRows?.length
      ? Math.round(readingRows.reduce((s, r) => s + (r.reading_speed_wpm ?? 0), 0) / readingRows.length)
      : 0;

    // Next incomplete lesson
    const { data: lessons } = await adminClient
      .from('lessons')
      .select('id, title, order_index')
      .order('order_index');

    const nextLesson = (lessons ?? []).find((l) => !completedIds.has(l.id)) ?? null;

    return res.status(200).json({
      totalXp: user?.total_xp ?? 0,
      level: user?.level ?? 1,
      levelTitle: user?.level_title ?? 'Beginner',
      currentStreak: user?.current_streak ?? 0,
      longestStreak: user?.longest_streak ?? 0,
      lessonsCompleted: lessonsCompleted ?? 0,
      charactersMastered: charactersMastered ?? 0,
      avgComprehension,
      avgWpm,
      nextLesson,
    });
  } catch (err: any) {
    const status = err.message?.includes('token') ? 401 : 500;
    return res.status(status).json({ error: err.message });
  }
}
