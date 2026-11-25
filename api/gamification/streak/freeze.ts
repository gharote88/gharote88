import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClient, getUserId } from '../../_lib/supabase';

// POST /api/gamification/streak/freeze — consume the weekly streak freeze
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const userId = await getUserId(req);
    const { data: user, error } = await adminClient
      .from('users')
      .select('streak_freeze_available, current_streak')
      .eq('id', userId)
      .single();

    if (error) throw error;
    if (!user.streak_freeze_available) {
      return res.status(400).json({ error: 'No streak freeze available' });
    }

    await adminClient
      .from('users')
      .update({ streak_freeze_available: false })
      .eq('id', userId);

    return res.status(200).json({
      success: true,
      currentStreak: user.current_streak,
      streakFreezeAvailable: false,
    });
  } catch (err: any) {
    const status = err.message?.includes('token') ? 401 : 500;
    return res.status(status).json({ error: err.message });
  }
}
