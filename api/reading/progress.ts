import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClient, getUserId } from '../_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const userId = await getUserId(req);
    const { data, error } = await adminClient
      .from('reading_progress').select('*').eq('user_id', userId);
    if (error) throw error;

    const rows = data ?? [];
    const completed = rows.filter((p) => p.status === 'completed').length;
    const wpmRows = rows.filter((p) => p.reading_speed_wpm);
    const compRows = rows.filter((p) => p.comprehension_score);

    return res.status(200).json({
      progress: rows,
      completed,
      avgWpm: wpmRows.length
        ? Math.round(wpmRows.reduce((s, p) => s + p.reading_speed_wpm, 0) / wpmRows.length) : 0,
      avgComprehension: compRows.length
        ? Math.round(compRows.reduce((s, p) => s + p.comprehension_score, 0) / compRows.length) : 0,
    });
  } catch (err: any) {
    const status = err.message?.includes('token') ? 401 : 500;
    return res.status(status).json({ error: err.message });
  }
}
