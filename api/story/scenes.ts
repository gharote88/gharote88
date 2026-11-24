import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClient, getUserId } from '../_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const userId = await getUserId(req);
    const chapterId = req.query.chapterId as string;
    if (!chapterId) return res.status(400).json({ error: 'chapterId required' });

    const [{ data: chapter, error: chapErr }, { data: user }] = await Promise.all([
      adminClient.from('story_chapters').select('*').eq('id', chapterId).single(),
      adminClient.from('users').select('level').eq('id', userId).single(),
    ]);

    if (chapErr || !chapter) return res.status(404).json({ error: 'Chapter not found' });
    if ((chapter.required_level ?? 1) > (user?.level ?? 1)) {
      return res.status(403).json({ error: 'Chapter locked' });
    }

    const { data: scenes, error: scenesErr } = await adminClient
      .from('story_scenes')
      .select('*')
      .eq('chapter_id', chapterId)
      .order('order_index');

    if (scenesErr) throw scenesErr;

    return res.status(200).json({ chapter, scenes: scenes ?? [] });
  } catch (err: any) {
    const status = err.message?.includes('token') ? 401 : 500;
    return res.status(status).json({ error: err.message });
  }
}
