import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClient, getUserId } from '../_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const userId = await getUserId(req);
    const { passageId, answers } = req.body as {
      passageId: string;
      answers: { questionId: string; answer: string }[];
    };
    if (!passageId || !answers) return res.status(400).json({ error: 'passageId and answers required' });

    const { data: questions, error } = await adminClient
      .from('reading_questions').select('id, correct_answer').eq('passage_id', passageId);
    if (error) throw error;
    if (!questions?.length) return res.status(404).json({ error: 'No questions found for this passage' });

    const qMap = new Map(questions.map((q) => [q.id, q.correct_answer]));
    let correct = 0;
    const results = answers.map(({ questionId, answer }) => {
      const correctAnswer = qMap.get(questionId) ?? '';
      const isCorrect = correctAnswer.toLowerCase() === answer.toLowerCase();
      if (isCorrect) correct++;
      return { questionId, isCorrect, correctAnswer };
    });

    const score = Math.round((correct / questions.length) * 100);
    const xpAward = score >= 60 ? 20 : 0;
    const now = new Date().toISOString();

    await adminClient.from('reading_progress').upsert({
      user_id: userId, passage_id: passageId,
      comprehension_score: score, status: 'completed',
      completed_at: now, xp_earned: xpAward, updated_at: now,
    }, { onConflict: 'user_id,passage_id' });

    return res.status(200).json({ score, correct, total: questions.length, xpAward, results });
  } catch (err: any) {
    const status = err.message?.includes('token') ? 401 : 500;
    return res.status(status).json({ error: err.message });
  }
}
