import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClient, getUserId } from '../_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const userId = await getUserId(req);

    const { data: progress, error } = await adminClient
      .from('journey_progress')
      .select(`
        *,
        journey_routes (
          id, start_city, start_city_marathi, target_city,
          description, distance_km, total_xp_required,
          checkpoints
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'in_progress')
      .single();

    if (error && error.code === 'PGRST116') {
      return res.status(200).json({ hasJourney: false });
    }
    if (error) throw error;

    const route = progress.journey_routes;
    const checkpoints = (route.checkpoints as any[]).map((cp: any) => ({
      ...cp,
      status: progress.completed_checkpoints?.includes(cp.id)
        ? 'completed'
        : route.checkpoints[progress.current_checkpoint_index]?.id === cp.id
          ? 'current'
          : 'locked',
    }));

    return res.status(200).json({
      hasJourney: true,
      journey: {
        currentRouteId: progress.route_id,
        currentCheckpointIndex: progress.current_checkpoint_index,
        currentPosition: progress.current_position,
        totalXpEarned: progress.total_xp_earned,
        progressPercentage: progress.progress_percentage,
        completedCheckpoints: progress.completed_checkpoints ?? [],
        startedAt: progress.started_at,
        lastUpdated: progress.updated_at,
      },
      route: {
        id: route.id,
        startCity: route.start_city,
        targetCity: route.target_city,
        totalDistance: route.distance_km,
        estimatedDuration: Math.ceil(route.distance_km / 50),
        checkpoints,
      },
    });
  } catch (err: any) {
    const status = err.message?.includes('token') ? 401 : 500;
    return res.status(status).json({ error: err.message });
  }
}
