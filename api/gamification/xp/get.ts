import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClient, getUserId } from '../../_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const userId = await getUserId(req);
    const { data, error } = await adminClient
      .from('users')
      .select('total_xp, level, level_title')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return res.status(200).json({ totalXp: data.total_xp, level: data.level, levelTitle: data.level_title });
  } catch (err: any) {
    const status = err.message?.includes('token') ? 401 : 500;
    return res.status(status).json({ error: err.message });
  }
}
