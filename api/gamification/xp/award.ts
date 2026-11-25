import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClient, getUserId } from '../../_lib/supabase';
import { computeLevel, evaluateBadges } from '../../_lib/gamification';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const userId = await getUserId(req);
    const { xpAmount, source, referenceId } = req.body as {
      xpAmount: number; source: string; referenceId?: string;
    };
    if (!xpAmount || !source) return res.status(400).json({ error: 'xpAmount and source required' });

    // Idempotency check
    if (referenceId) {
      const { data: dup } = await adminClient
        .from('xp_transactions')
        .select('id')
        .eq('user_id', userId)
        .eq('reference_id', referenceId)
        .limit(1)
        .single();
      if (dup) {
        const { data: user } = await adminClient.from('users').select('total_xp').eq('id', userId).single();
        return res.status(200).json({ duplicate: true, totalXp: user?.total_xp ?? 0 });
      }
    }

    const { data: user } = await adminClient.from('users').select('total_xp').eq('id', userId).single();
    const newTotalXp = (user?.total_xp ?? 0) + xpAmount;
    const { level, levelTitle } = computeLevel(newTotalXp);

    await Promise.all([
      adminClient.from('users').update({ total_xp: newTotalXp, level, level_title: levelTitle }).eq('id', userId),
      adminClient.from('xp_transactions').insert({
        user_id: userId, xp_amount: xpAmount, source,
        reference_id: referenceId ?? null, created_at: new Date().toISOString(),
      }),
    ]);

    // Fire-and-forget badge evaluation — direct call, no HTTP, no SSRF surface
    evaluateBadges(userId, newTotalXp, level).catch(() => {});

    return res.status(200).json({ totalXp: newTotalXp, level, levelTitle, xpAwarded: xpAmount });
  } catch (err: any) {
    const status = err.message?.includes('token') ? 401 : 500;
    return res.status(status).json({ error: err.message });
  }
}
