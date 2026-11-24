import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClient, getUserId } from '../../_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const userId = await getUserId(req);

    const [{ data: allBadges }, { data: earned }] = await Promise.all([
      adminClient.from('badges').select('*').order('xp_reward'),
      adminClient.from('user_badges').select('badge_id, earned_at').eq('user_id', userId),
    ]);

    const earnedMap = new Map((earned ?? []).map((e) => [e.badge_id, e.earned_at]));

    return res.status(200).json({
      badges: (allBadges ?? []).map((b) => ({
        ...b,
        earned: earnedMap.has(b.id),
        earnedAt: earnedMap.get(b.id) ?? null,
      })),
    });
  } catch (err: any) {
    const status = err.message?.includes('token') ? 401 : 500;
    return res.status(status).json({ error: err.message });
  }
}
