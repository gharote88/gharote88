import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClient, getUserId } from '../_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const userId = await getUserId(req);
    const { data, error } = await adminClient
      .from('writing_progress').select('*').eq('user_id', userId);
    if (error) throw error;

    return res.status(200).json({
      progress: data ?? [],
      masteredCount: (data ?? []).filter((p) => p.mastered).length,
      totalCharacters: data?.length ?? 0,
    });
  } catch (err: any) {
    const status = err.message?.includes('token') ? 401 : 500;
    return res.status(status).json({ error: err.message });
  }
}
