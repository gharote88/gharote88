import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClient, getUserId } from '../_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await getUserId(req);
    const { level, type, lessonId } = req.query as Record<string, string>;

    let query = adminClient.from('writing_characters').select('*').order('order_index');
    if (level) query = query.eq('level', level);
    if (type) query = query.eq('type', type);
    if (lessonId) query = query.eq('lesson_id', lessonId);

    const { data, error } = await query;
    if (error) throw error;
    return res.status(200).json(data ?? []);
  } catch (err: any) {
    const status = err.message?.includes('token') ? 401 : 500;
    return res.status(status).json({ error: err.message });
  }
}
