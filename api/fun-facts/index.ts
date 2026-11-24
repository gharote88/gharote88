import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClient, getUserId } from '../_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const userId = await getUserId(req);
    const action = req.query.action as string;

    // GET /api/fun-facts?action=today
    if (req.method === 'GET' && action === 'today') {
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      const { data: fotd, error } = await adminClient
        .from('fact_of_the_day').select('fact_id').eq('date', today).single();
      if (error || !fotd) return res.status(404).json({ error: 'No fact of the day set' });

      const { data: fact } = await adminClient
        .from('fun_facts').select('*').eq('id', fotd.fact_id).single();
      if (!fact) return res.status(404).json({ error: 'Fact not found' });
      return res.status(200).json(fact);
    }

    // GET /api/fun-facts?action=random[&category=]
    if (req.method === 'GET' && action === 'random') {
      const category = req.query.category as string | undefined;
      let query = adminClient.from('fun_facts').select('*');
      if (category) query = query.eq('category', category);
      const { data } = await query;
      if (!data?.length) return res.status(404).json({ error: 'No facts found' });
      const fact = data[Math.floor(Math.random() * data.length)];
      return res.status(200).json(fact);
    }

    // GET /api/fun-facts?action=favorites
    if (req.method === 'GET' && action === 'favorites') {
      const { data: favs } = await adminClient
        .from('favorite_facts')
        .select('fact_id, saved_at')
        .eq('user_id', userId)
        .order('saved_at', { ascending: false });

      if (!favs?.length) return res.status(200).json([]);

      const { data: facts } = await adminClient
        .from('fun_facts').select('*').in('id', favs.map((f) => f.fact_id));

      const savedMap = new Map(favs.map((f) => [f.fact_id, f.saved_at]));
      return res.status(200).json(
        (facts ?? []).map((f) => ({ ...f, savedAt: savedMap.get(f.id) }))
      );
    }

    // POST /api/fun-facts?action=toggle
    if (req.method === 'POST' && action === 'toggle') {
      const { factId } = req.body as { factId: string };
      if (!factId) return res.status(400).json({ error: 'factId required' });

      const { data: existing } = await adminClient
        .from('favorite_facts').select('id').eq('user_id', userId).eq('fact_id', factId).single();

      if (existing) {
        await adminClient.from('favorite_facts').delete().eq('user_id', userId).eq('fact_id', factId);
        return res.status(200).json({ favorited: false });
      }
      await adminClient.from('favorite_facts').insert({
        user_id: userId, fact_id: factId, saved_at: new Date().toISOString(),
      });
      return res.status(200).json({ favorited: true });
    }

    // POST /api/fun-facts?action=quiz
    if (req.method === 'POST' && action === 'quiz') {
      const { answer, correctAnswer } = req.body as { answer: string; correctAnswer: string };
      if (!answer || !correctAnswer) return res.status(400).json({ error: 'answer and correctAnswer required' });
      const isCorrect = answer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
      return res.status(200).json({ isCorrect, xpAward: isCorrect ? 10 : 0 });
    }

    return res.status(404).json({ error: 'Unknown action' });
  } catch (err: any) {
    const status = err.message?.includes('token') ? 401 : 500;
    return res.status(status).json({ error: err.message });
  }
}
