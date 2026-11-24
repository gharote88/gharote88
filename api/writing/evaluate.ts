import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClient, getUserId } from '../_lib/supabase';
import { dtwScore } from '../_lib/dtw';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const userId = await getUserId(req);
    const { characterId, userStrokes, referenceId } = req.body as {
      characterId: string;
      userStrokes: { x: number; y: number }[][];
      referenceId?: string;
    };
    if (!characterId || !userStrokes) {
      return res.status(400).json({ error: 'characterId and userStrokes required' });
    }

    const { data: char, error } = await adminClient
      .from('writing_characters').select('*').eq('id', characterId).single();
    if (error || !char) return res.status(404).json({ error: 'Character not found' });

    const refStrokes = (char.stroke_data as { points: [number, number][] }[])
      .map((s) => s.points.map(([x, y]) => ({ x, y })));

    const score = dtwScore(refStrokes, userStrokes);
    const xpAward = score >= 60 ? 10 : 0;
    const mastered = score >= 80;
    const now = new Date().toISOString();

    // Upsert — keep best score
    const { data: existing } = await adminClient
      .from('writing_progress')
      .select('accuracy_score, attempts, mastered')
      .eq('user_id', userId).eq('character_id', characterId).single();

    await adminClient.from('writing_progress').upsert({
      user_id: userId,
      character_id: characterId,
      accuracy_score: existing ? Math.max(existing.accuracy_score ?? 0, score) : score,
      attempts: (existing?.attempts ?? 0) + 1,
      mastered: existing?.mastered || mastered,
      last_practiced_at: now,
      updated_at: now,
    }, { onConflict: 'user_id,character_id' });

    return res.status(200).json({
      score, xpAward, mastered,
      character: char.character,
      referenceId: referenceId ?? null,
    });
  } catch (err: any) {
    const status = err.message?.includes('token') ? 401 : 500;
    return res.status(status).json({ error: err.message });
  }
}
