import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClient, getUserId } from '../_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await getUserId(req);
    const { level, type, lessonId } = req.query as Record<string, string>;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 10);

    let query = adminClient.from('reading_passages').select('*', { count: 'exact' }).order('order_index');
    if (level) query = query.eq('level', level);
    if (type) query = query.eq('type', type);
    if (lessonId) query = query.eq('lesson_id', lessonId);

    const from = (page - 1) * limit;
    const { data, count, error } = await query.range(from, from + limit - 1);
    if (error) throw error;

    return res.status(200).json({
      passages: data ?? [],
      total: count ?? 0,
      page, limit,
      pages: Math.ceil((count ?? 0) / limit),
    });
  } catch (err: any) {
    const status = err.message?.includes('token') ? 401 : 500;
    return res.status(status).json({ error: err.message });
  }
}
