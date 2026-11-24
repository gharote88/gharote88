import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClient, getUserId } from '../../_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const userId = await getUserId(req);
    const { data, error } = await adminClient
      .from('users')
      .select('current_streak, longest_streak, streak_freeze_available, last_activity_date')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return res.status(200).json({
      currentStreak: data.current_streak ?? 0,
      longestStreak: data.longest_streak ?? 0,
      streakFreezeAvailable: data.streak_freeze_available ?? true,
      lastActivityDate: data.last_activity_date,
    });
  } catch (err: any) {
    const status = err.message?.includes('token') ? 401 : 500;
    return res.status(status).json({ error: err.message });
  }
}
