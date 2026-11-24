import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClient, getUserId } from '../_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await getUserId(req);
    const { level, id } = req.query as Record<string, string>;

    // Single lesson
    if (id) {
      const { data, error } = await adminClient
        .from('writing_lessons').select('*').eq('id', id).single();
      if (error || !data) return res.status(404).json({ error: 'Writing lesson not found' });
      return res.status(200).json(data);
    }

    // List
    let query = adminClient.from('writing_lessons').select('*').order('order_index');
    if (level) query = query.eq('level', level);
    const { data, error } = await query;
    if (error) throw error;
    return res.status(200).json(data ?? []);
  } catch (err: any) {
    const status = err.message?.includes('token') ? 401 : 500;
    return res.status(status).json({ error: err.message });
  }
}
