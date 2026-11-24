import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClient, getUserId } from '../_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const userId = await getUserId(req);
    const { lessonId, answers, referenceId } = req.body as {
      lessonId: string;
      answers: { questionId: string; answer: string; timeTakenMs?: number }[];
      referenceId?: string;
    };
    if (!lessonId || !answers) return res.status(400).json({ error: 'lessonId and answers required' });

    const { data: questions, error } = await adminClient
      .from('quiz_questions')
      .select('id, correct_answer')
      .eq('lesson_id', lessonId);

    if (error) throw error;
    if (!questions?.length) return res.status(404).json({ error: 'No questions found' });

    const qMap = new Map(questions.map((q) => [q.id, q.correct_answer]));
    let correct = 0;
    const attempts: object[] = [];
    const results: object[] = [];

    for (const { questionId, answer, timeTakenMs = 0 } of answers) {
      const correctAnswer = qMap.get(questionId) ?? '';
      const isCorrect = correctAnswer.toLowerCase() === answer.toLowerCase();
      if (isCorrect) correct++;
      const xpEarned = isCorrect ? (timeTakenMs < 5000 ? 15 : 10) : 0;

      attempts.push({
        user_id: userId, question_id: questionId, lesson_id: lessonId,
        answer_given: answer, is_correct: isCorrect,
        time_taken_ms: timeTakenMs, xp_earned: xpEarned,
        created_at: new Date().toISOString(),
      });
      results.push({ questionId, isCorrect, correctAnswer, xpEarned });
    }

    await adminClient.from('quiz_attempts').insert(attempts);

    const score = Math.round((correct / questions.length) * 100);
    const quizXp = Math.round((score / 100) * 30);

    return res.status(200).json({
      score, correct, total: questions.length, quizXp, results,
      referenceId: referenceId ?? null,
    });
  } catch (err: any) {
    const status = err.message?.includes('token') ? 401 : 500;
    return res.status(status).json({ error: err.message });
  }
}
