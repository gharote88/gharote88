import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClient, getUserId } from '../_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await getUserId(req);
    const lessonId = req.query.lessonId as string;
    if (!lessonId) return res.status(400).json({ error: 'lessonId required' });

    const { data, error } = await adminClient
      .from('quiz_questions')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('order_index');

    if (error) throw error;
    if (!data?.length) return res.status(404).json({ error: 'No quiz questions found' });

    return res.status(200).json(data);
  } catch (err: any) {
    const status = err.message?.includes('token') ? 401 : 500;
    return res.status(status).json({ error: err.message });
  }
}
