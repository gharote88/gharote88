import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserId } from '../../_lib/supabase';
import { evaluateBadges } from '../../_lib/gamification';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const userId = await getUserId(req);
    const { totalXp, level } = req.body as { totalXp: number; level: number };
    if (totalXp === undefined || level === undefined) {
      return res.status(400).json({ error: 'totalXp and level required' });
    }

    const newlyEarned = await evaluateBadges(userId, totalXp, level);
    return res.status(200).json({ newlyEarned });
  } catch (err: any) {
    const status = err.message?.includes('token') ? 401 : 500;
    return res.status(status).json({ error: err.message });
  }
}
