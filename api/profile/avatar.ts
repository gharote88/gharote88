import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClient, getUserId } from '../_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const userId = await getUserId(req);
    const action = req.query.action as string;

    // GET /api/profile/avatar
    if (req.method === 'GET') {
      const [{ data: user }, { data: items }] = await Promise.all([
        adminClient.from('users').select('total_xp, level, equipped_items, unlocked_items').eq('id', userId).single(),
        adminClient.from('avatar_items').select('*').order('category'),
      ]);

      const equipped: string[] = user?.equipped_items ?? [];
      const unlocked: string[] = user?.unlocked_items ?? [];
      const totalXp = user?.total_xp ?? 0;
      const level = user?.level ?? 1;

      return res.status(200).json({
        equippedItems: equipped,
        unlockedItems: unlocked,
        items: (items ?? []).map((item) => ({
          ...item,
          unlocked: item.xp_cost === 0 || unlocked.includes(item.id),
          equipped: equipped.includes(item.id),
          canUnlock: totalXp >= item.xp_cost && level >= (item.level_required ?? 1),
        })),
      });
    }

    // PUT /api/profile/avatar?action=equip
    if (req.method === 'PUT' && action === 'equip') {
      const { equippedItems } = req.body as { equippedItems: string[] };
      if (!Array.isArray(equippedItems)) return res.status(400).json({ error: 'equippedItems array required' });

      await adminClient.from('users').update({ equipped_items: equippedItems }).eq('id', userId);
      return res.status(200).json({ equippedItems });
    }

    // POST /api/profile/avatar?action=unlock
    if (req.method === 'POST' && action === 'unlock') {
      const { itemId } = req.body as { itemId: string };
      if (!itemId) return res.status(400).json({ error: 'itemId required' });

      const [{ data: item, error: itemErr }, { data: user }] = await Promise.all([
        adminClient.from('avatar_items').select('*').eq('id', itemId).single(),
        adminClient.from('users').select('total_xp, level, unlocked_items').eq('id', userId).single(),
      ]);

      if (itemErr || !item) return res.status(404).json({ error: 'Item not found' });
      if ((user?.total_xp ?? 0) < item.xp_cost) return res.status(402).json({ error: 'Insufficient XP' });
      if ((user?.level ?? 1) < (item.level_required ?? 1)) return res.status(403).json({ error: 'Level requirement not met' });

      const unlocked: string[] = user?.unlocked_items ?? [];
      if (unlocked.includes(itemId)) return res.status(200).json({ unlocked: true, itemId, xpSpent: 0, alreadyOwned: true });

      const newXp = (user?.total_xp ?? 0) - item.xp_cost;
      await Promise.all([
        adminClient.from('users').update({
          total_xp: newXp,
          unlocked_items: [...unlocked, itemId],
        }).eq('id', userId),
        adminClient.from('xp_transactions').insert({
          user_id: userId, xp_amount: -item.xp_cost,
          source: 'avatar_unlock', reference_id: `avatar_unlock_${itemId}`,
          created_at: new Date().toISOString(),
        }),
      ]);

      return res.status(200).json({ unlocked: true, itemId, xpSpent: item.xp_cost });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    const status = err.message?.includes('token') ? 401 : 500;
    return res.status(status).json({ error: err.message });
  }
}
