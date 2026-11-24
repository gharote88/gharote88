import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClient, getUserId } from '../../_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await getUserId(req); // auth check only

    const monday = new Date();
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    const weekStart = monday.toLocaleDateString('en-CA');

    const { data: entries, error } = await adminClient
      .from('leaderboard')
      .select('user_id, weekly_xp, display_name, avatar_url, under_13')
      .eq('week_start', weekStart)
      .order('weekly_xp', { ascending: false })
      .limit(50);

    if (error) throw error;

    return res.status(200).json({
      weekStart,
      entries: (entries ?? []).map((e, i) => ({
        rank: i + 1,
        weeklyXp: e.weekly_xp,
        userId: e.user_id,
        displayName: e.under_13
          ? `${e.display_name?.split(' ')[0]} ${e.display_name?.split(' ')[1]?.[0] ?? ''}.`.trim()
          : e.display_name,
        avatarUrl: e.under_13 ? null : e.avatar_url,
      })),
    });
  } catch (err: any) {
    const status = err.message?.includes('token') ? 401 : 500;
    return res.status(status).json({ error: err.message });
  }
}
