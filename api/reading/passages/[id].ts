import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClient, getUserId } from '../../_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const userId = await getUserId(req);
    const passageId = req.query.id as string;
    if (!passageId) return res.status(400).json({ error: 'passageId required' });

    const [
      { data: passage, error: passageErr },
      { data: vocab },
      { data: questions },
      { data: userProgress },
    ] = await Promise.all([
      adminClient.from('reading_passages').select('*').eq('id', passageId).single(),
      adminClient.from('reading_vocab').select('*').eq('passage_id', passageId).order('position_in_text'),
      adminClient.from('reading_questions').select('*').eq('passage_id', passageId).order('order_index'),
      adminClient.from('reading_progress').select('*').eq('user_id', userId).eq('passage_id', passageId).single(),
    ]);

    if (passageErr || !passage) return res.status(404).json({ error: 'Passage not found' });

    return res.status(200).json({
      ...passage,
      vocabulary: vocab ?? [],
      comprehensionQuestions: questions ?? [],
      userProgress: userProgress ?? null,
    });
  } catch (err: any) {
    const status = err.message?.includes('token') ? 401 : 500;
    return res.status(status).json({ error: err.message });
  }
}
