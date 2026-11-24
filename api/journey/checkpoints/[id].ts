import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClient, getUserId } from '../../_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const userId = await getUserId(req);
    const checkpointId = req.query.id as string;
    if (!checkpointId) return res.status(400).json({ error: 'Checkpoint id required' });

    // Load the user's active journey to find the route containing this checkpoint
    const { data: progress, error: progressErr } = await adminClient
      .from('journey_progress')
      .select('completed_checkpoints, current_checkpoint_index, journey_routes(checkpoints)')
      .eq('user_id', userId)
      .eq('status', 'in_progress')
      .single();

    if (progressErr || !progress) return res.status(404).json({ error: 'No active journey found' });

    const checkpoints: any[] = (progress.journey_routes as any).checkpoints ?? [];
    const checkpoint = checkpoints.find((cp: any) => cp.id === checkpointId);
    if (!checkpoint) return res.status(404).json({ error: 'Checkpoint not found on active route' });

    const completedCheckpoints: string[] = progress.completed_checkpoints ?? [];
    const currentCpId = checkpoints[progress.current_checkpoint_index]?.id;
    const status = completedCheckpoints.includes(checkpointId)
      ? 'completed'
      : currentCpId === checkpointId
        ? 'current'
        : 'locked';

    // Fetch unlocked lessons for this checkpoint
    const lessonIds: string[] = checkpoint.unlocks ?? [];
    const { data: lessons } = lessonIds.length
      ? await adminClient
          .from('lessons')
          .select('id, title, title_marathi, level, topic, xp_reward, estimated_minutes')
          .in('id', lessonIds)
      : { data: [] };

    // Fetch associated trivia (fun fact) if present
    let trivia = null;
    if (checkpoint.triviaId) {
      const { data: fact } = await adminClient
        .from('fun_facts')
        .select('id, category, content_english, content_marathi, content_transliteration, related_vocabulary, image_url')
        .eq('id', checkpoint.triviaId)
        .single();
      trivia = fact ?? null;
    }

    return res.status(200).json({
      checkpoint: {
        id: checkpoint.id,
        name: checkpoint.name,
        nameMarathi: checkpoint.marathiName,
        position: checkpoint.position,
        requiredXp: checkpoint.requiredXp,
        status,
      },
      unlockedLessons: lessons ?? [],
      trivia,
    });
  } catch (err: any) {
    const status = err.message?.includes('token') ? 401 : 500;
    return res.status(status).json({ error: err.message });
  }
}
