import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClient, getUserId } from '../_lib/supabase';

interface Checkpoint {
  id: string;
  requiredXp: number;
  unlocks: string[];
  triviaId: string;
}

function interpolatePosition(xp: number, checkpoints: Checkpoint[]) {
  for (let i = checkpoints.length - 1; i >= 0; i--) {
    if (xp >= checkpoints[i].requiredXp) {
      const next = checkpoints[i + 1] as any;
      if (!next) return (checkpoints[i] as any).position;
      const t = (xp - checkpoints[i].requiredXp) / (next.requiredXp - checkpoints[i].requiredXp);
      const cur = (checkpoints[i] as any).position;
      return { x: cur.x + (next.position.x - cur.x) * t, y: cur.y + (next.position.y - cur.y) * t };
    }
  }
  return (checkpoints[0] as any).position;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const userId = await getUserId(req);
    const { xpEarned, lessonId } = req.body as { xpEarned: number; lessonId?: string };

    if (typeof xpEarned !== 'number' || xpEarned < 0) {
      return res.status(400).json({ error: 'xpEarned must be a non-negative number' });
    }

    // Load active journey + route
    const { data: progress, error: fetchErr } = await adminClient
      .from('journey_progress')
      .select('*, journey_routes(total_xp_required, checkpoints)')
      .eq('user_id', userId)
      .eq('status', 'in_progress')
      .single();

    if (fetchErr) throw new Error('No active journey found');

    const route = progress.journey_routes;
    const checkpoints: Checkpoint[] = route.checkpoints;
    const newTotalXp = progress.total_xp_earned + xpEarned;
    const progressPercentage = Math.min((newTotalXp / route.total_xp_required) * 100, 100);
    const newPosition = interpolatePosition(newTotalXp, checkpoints);

    // Detect newly completed checkpoints
    const alreadyCompleted: string[] = progress.completed_checkpoints ?? [];
    const newlyCompleted = checkpoints
      .filter((cp) => newTotalXp >= cp.requiredXp && !alreadyCompleted.includes(cp.id))
      .map((cp) => cp.id);

    const updatedCompleted = [...alreadyCompleted, ...newlyCompleted];
    const newCheckpointIndex = checkpoints.findLastIndex(
      (cp) => updatedCompleted.includes(cp.id)
    );

    const isCompleted = progressPercentage >= 100;

    const { error: updateErr } = await adminClient
      .from('journey_progress')
      .update({
        total_xp_earned: newTotalXp,
        progress_percentage: progressPercentage,
        current_position: newPosition,
        completed_checkpoints: updatedCompleted,
        current_checkpoint_index: Math.max(newCheckpointIndex, 0),
        status: isCompleted ? 'completed' : 'in_progress',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('route_id', progress.route_id);

    if (updateErr) throw updateErr;

    // Also update user total_xp
    await adminClient
      .from('users')
      .update({ total_xp: newTotalXp })
      .eq('id', userId);

    // Build unlock details for newly completed checkpoints
    const newUnlocks = newlyCompleted.map((cpId) => {
      const cp = checkpoints.find((c) => c.id === cpId)!;
      return { checkpointId: cpId, lessons: cp.unlocks, trivia: [cp.triviaId], badges: [] };
    });

    return res.status(200).json({
      success: true,
      newPosition,
      progressPercentage,
      newUnlocks,
      journeyCompleted: isCompleted,
    });
  } catch (err: any) {
    const status = err.message?.includes('token') ? 401 : 500;
    return res.status(status).json({ error: err.message });
  }
}
