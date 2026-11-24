import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClient, getUserId } from '../_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const userId = await getUserId(req);
    const { lessonId, status, score } = req.body as {
      lessonId: string; status: string; score?: number;
    };
    if (!lessonId || !status) return res.status(400).json({ error: 'lessonId and status required' });

    const now = new Date().toISOString();
    const payload: Record<string, any> = {
      user_id: userId,
      lesson_id: lessonId,
      status,
      score: score ?? 0,
      updated_at: now,
    };
    if (status === 'completed') payload.completed_at = now;

    const { error } = await adminClient
      .from('lesson_progress')
      .upsert(payload, { onConflict: 'user_id,lesson_id' });

    if (error) throw error;
    return res.status(200).json({ success: true });
  } catch (err: any) {
    const status = err.message?.includes('token') ? 401 : 500;
    return res.status(status).json({ error: err.message });
  }
}
