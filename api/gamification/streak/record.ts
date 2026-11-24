import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClient, getUserId } from '../../_lib/supabase';
import { isSameDay, isYesterday } from '../../_lib/gamification';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const userId = await getUserId(req);
    const now = new Date();

    const { data: user, error } = await adminClient
      .from('users')
      .select('current_streak, longest_streak, last_activity_date, streak_freeze_available')
      .eq('id', userId)
      .single();

    if (error) throw error;

    const last = user.last_activity_date ? new Date(user.last_activity_date) : null;

    // Same day — no-op
    if (last && isSameDay(last, now)) {
      return res.status(200).json({
        currentStreak: user.current_streak,
        longestStreak: user.longest_streak,
      });
    }

    let newStreak = user.current_streak ?? 1;

    if (!last) {
      newStreak = 1;
    } else if (isYesterday(last, now)) {
      newStreak += 1;
    } else {
      if (user.streak_freeze_available) {
        await adminClient.from('users').update({ streak_freeze_available: false }).eq('id', userId);
      } else {
        newStreak = 1;
      }
    }

    const longestStreak = Math.max(newStreak, user.longest_streak ?? 0);

    await adminClient.from('users').update({
      current_streak: newStreak,
      longest_streak: longestStreak,
      last_activity_date: now.toISOString(),
    }).eq('id', userId);

    return res.status(200).json({ currentStreak: newStreak, longestStreak });
  } catch (err: any) {
    const status = err.message?.includes('token') ? 401 : 500;
    return res.status(status).json({ error: err.message });
  }
}
