import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClient, getUserId } from '../_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const userId = await getUserId(req);

    // GET /api/mini-games?type=&level=
    if (req.method === 'GET') {
      const { type, level } = req.query as Record<string, string>;
      if (!type) return res.status(400).json({ error: 'type required' });

      let query = adminClient.from('mini_games').select('*').eq('type', type);
      if (level) query = query.eq('level', level);
      const { data, error } = await query.limit(1).single();

      if (error || !data) return res.status(404).json({ error: 'Mini-game not found' });
      return res.status(200).json(data);
    }

    // POST /api/mini-games?action=submit
    if (req.method === 'POST') {
      const { gameId, score, referenceId } = req.body as {
        gameId: string; score: number; referenceId?: string;
      };
      if (!gameId || score === undefined) return res.status(400).json({ error: 'gameId and score required' });

      const { data: game, error } = await adminClient
        .from('mini_games').select('xp_reward, type').eq('id', gameId).single();
      if (error || !game) return res.status(404).json({ error: 'Game not found' });

      const xpEarned = score >= 60 ? Math.round((score / 100) * (game.xp_reward ?? 30)) : 0;

      if (xpEarned > 0) {
        const ref = referenceId ?? `mini_game_${gameId}_${userId}_${Date.now()}`;
        const { data: existing } = await adminClient
          .from('xp_transactions').select('id').eq('reference_id', ref).maybeSingle();
        if (!existing) {
          const { data: userData } = await adminClient
            .from('users').select('total_xp').eq('id', userId).single();
          await Promise.all([
            adminClient.from('xp_transactions').insert({
              user_id: userId, xp_amount: xpEarned, source: 'mini_game',
              reference_id: ref, created_at: new Date().toISOString(),
            }),
            adminClient.from('users')
              .update({ total_xp: (userData?.total_xp ?? 0) + xpEarned })
              .eq('id', userId),
          ]);
        }
      }

      return res.status(200).json({ score, xpEarned, gameType: game.type });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    const status = err.message?.includes('token') ? 401 : 500;
    return res.status(status).json({ error: err.message });
  }
}
