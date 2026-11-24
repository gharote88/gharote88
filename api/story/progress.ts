import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClient, getUserId } from '../_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const userId = await getUserId(req);
    const { chapterId, currentSceneId, status } = req.body as {
      chapterId: string; currentSceneId?: string; status: string;
    };
    if (!chapterId || !status) return res.status(400).json({ error: 'chapterId and status required' });

    const now = new Date().toISOString();
    const payload: Record<string, any> = {
      user_id: userId, chapter_id: chapterId,
      current_scene_id: currentSceneId ?? null,
      status, updated_at: now,
    };
    if (status === 'completed') payload.completed_at = now;

    const { error } = await adminClient
      .from('story_progress')
      .upsert(payload, { onConflict: 'user_id,chapter_id' });

    if (error) throw error;
    return res.status(200).json({ success: true });
  } catch (err: any) {
    const status = err.message?.includes('token') ? 401 : 500;
    return res.status(status).json({ error: err.message });
  }
}
