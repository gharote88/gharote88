import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClient, getUserId } from '../_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const userId = await getUserId(req);
    const { routeId } = req.body as { routeId: string };
    if (!routeId) return res.status(400).json({ error: 'routeId is required' });

    // Verify route exists
    const { data: route, error: routeErr } = await adminClient
      .from('journey_routes')
      .select('id, checkpoints')
      .eq('id', routeId)
      .single();

    if (routeErr || !route) return res.status(404).json({ error: 'Route not found' });

    const startPosition = (route.checkpoints as any[])[0]?.position ?? { x: 0, y: 0 };

    // Upsert — idempotent if called twice
    const { data, error } = await adminClient
      .from('journey_progress')
      .upsert(
        {
          user_id: userId,
          route_id: routeId,
          current_checkpoint_index: 0,
          completed_checkpoints: [],
          current_position: startPosition,
          total_xp_earned: 0,
          progress_percentage: 0,
          status: 'in_progress',
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,route_id', ignoreDuplicates: true }
      )
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({ success: true, progress: data });
  } catch (err: any) {
    const status = err.message?.includes('token') ? 401 : 500;
    return res.status(status).json({ error: err.message });
  }
}
