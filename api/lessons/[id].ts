import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClient, getUserId } from '../_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const userId = await getUserId(req);
    const lessonId = req.query.id as string;
    if (!lessonId) return res.status(400).json({ error: 'lessonId required' });

    const [
      { data: lesson, error: lessonErr },
      { data: phrases },
      { data: quizQuestions },
      { data: writingChars },
      { data: passages },
      { data: userProgress },
    ] = await Promise.all([
      adminClient.from('lessons').select('*').eq('id', lessonId).single(),
      adminClient.from('phrases').select('*').eq('lesson_id', lessonId).order('order_index'),
      adminClient.from('quiz_questions').select('*').eq('lesson_id', lessonId).order('order_index'),
      adminClient.from('writing_characters').select('*').eq('lesson_id', lessonId).order('order_index'),
      adminClient.from('reading_passages').select('*').eq('lesson_id', lessonId).limit(1),
      adminClient.from('lesson_progress').select('*').eq('user_id', userId).eq('lesson_id', lessonId).single(),
    ]);

    if (lessonErr || !lesson) return res.status(404).json({ error: 'Lesson not found' });

    return res.status(200).json({
      ...lesson,
      phrases: phrases ?? [],
      quizQuestions: quizQuestions ?? [],
      writingCharacters: writingChars ?? [],
      readingPassages: passages ?? [],
      userProgress: userProgress ?? null,
    });
  } catch (err: any) {
    const status = err.message?.includes('token') ? 401 : 500;
    return res.status(status).json({ error: err.message });
  }
}
