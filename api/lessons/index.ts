import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClient, getUserId } from '../_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const userId = await getUserId(req);
    const level = req.query.level as string | undefined;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 10);

    let query = adminClient.from('lessons').select('*', { count: 'exact' }).order('order_index');
    if (level) query = query.eq('level', level);

    const from = (page - 1) * limit;
    const { data: lessons, count, error } = await query.range(from, from + limit - 1);
    if (error) throw error;

    const { data: progress } = await adminClient
      .from('lesson_progress')
      .select('lesson_id, status, score, completed_at')
      .eq('user_id', userId);

    const progressMap = new Map((progress ?? []).map((p) => [p.lesson_id, p]));

    return res.status(200).json({
      lessons: (lessons ?? []).map((l) => ({ ...l, userProgress: progressMap.get(l.id) ?? null })),
      total: count ?? 0,
      page,
      limit,
      pages: Math.ceil((count ?? 0) / limit),
    });
  } catch (err: any) {
    const status = err.message?.includes('token') ? 401 : 500;
    return res.status(status).json({ error: err.message });
  }
}
