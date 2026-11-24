import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClient, getUserId } from '../_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const userId = await getUserId(req);

    const [
      { data: user },
      { data: chapters, error },
      { data: progress },
    ] = await Promise.all([
      adminClient.from('users').select('level').eq('id', userId).single(),
      adminClient.from('story_chapters').select('*').order('order_index'),
      adminClient.from('story_progress').select('*').eq('user_id', userId),
    ]);

    if (error) throw error;
    const userLevel = user?.level ?? 1;
    const progressMap = new Map((progress ?? []).map((p) => [p.chapter_id, p]));

    return res.status(200).json(
      (chapters ?? []).map((c) => ({
        ...c,
        locked: (c.required_level ?? 1) > userLevel,
        progress: progressMap.get(c.id) ?? null,
      }))
    );
  } catch (err: any) {
    const status = err.message?.includes('token') ? 401 : 500;
    return res.status(status).json({ error: err.message });
  }
}
