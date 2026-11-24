import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClient, getUserId } from '../../_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const userId = await getUserId(req);
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

    const { data: challenge, error } = await adminClient
      .from('daily_challenges')
      .select('*')
      .eq('date', today)
      .single();

    if (error || !challenge) return res.status(404).json({ error: 'No challenge for today' });

    const { data: completion } = await adminClient
      .from('challenge_completions')
      .select('*')
      .eq('user_id', userId)
      .eq('challenge_id', challenge.id)
      .single();

    return res.status(200).json({
      ...challenge,
      completed: !!completion,
      completion: completion ?? null,
    });
  } catch (err: any) {
    const status = err.message?.includes('token') ? 401 : 500;
    return res.status(status).json({ error: err.message });
  }
}
