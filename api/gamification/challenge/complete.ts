import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClient, getUserId } from '../../_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const userId = await getUserId(req);
    const { challengeId, score } = req.body as { challengeId: string; score: number };
    if (!challengeId || score === undefined) {
      return res.status(400).json({ error: 'challengeId and score required' });
    }

    // Idempotency check
    const { data: existing } = await adminClient
      .from('challenge_completions')
      .select('xp_earned')
      .eq('user_id', userId)
      .eq('challenge_id', challengeId)
      .single();

    if (existing) return res.status(200).json({ duplicate: true, xpEarned: existing.xp_earned });

    const { data: challenge, error } = await adminClient
      .from('daily_challenges')
      .select('xp_reward')
      .eq('id', challengeId)
      .single();

    if (error || !challenge) return res.status(404).json({ error: 'Challenge not found' });

    const xpEarned = (challenge.xp_reward ?? 40) + (score === 100 ? 20 : 0);

    await adminClient.from('challenge_completions').insert({
      user_id: userId,
      challenge_id: challengeId,
      score,
      xp_earned: xpEarned,
      completed_at: new Date().toISOString(),
    });

    return res.status(200).json({ xpEarned, score });
  } catch (err: any) {
    const status = err.message?.includes('token') ? 401 : 500;
    return res.status(status).json({ error: err.message });
  }
}
