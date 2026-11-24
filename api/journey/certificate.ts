import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClient, getUserId } from '../_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const userId = await getUserId(req);
    const { journeyId } = req.body as { journeyId: string };
    if (!journeyId) return res.status(400).json({ error: 'journeyId required' });

    // Verify the journey is actually completed by this user
    const { data: progress, error } = await adminClient
      .from('journey_progress')
      .select('status, total_xp_earned, completed_checkpoints, started_at, updated_at, journey_routes(start_city, target_city)')
      .eq('user_id', userId)
      .eq('route_id', journeyId)
      .single();

    if (error || !progress) return res.status(404).json({ error: 'Journey not found' });
    if (progress.status !== 'completed') return res.status(400).json({ error: 'Journey not yet completed' });

    const { data: user } = await adminClient
      .from('users')
      .select('display_name, level, level_title')
      .eq('id', userId)
      .single();

    const route = progress.journey_routes as any;

    // Build a certificate URL using query params — rendered by the web app at /certificate
    const params = new URLSearchParams({
      name: user?.display_name ?? 'Learner',
      from: route?.start_city ?? '',
      to: route?.target_city ?? '',
      xp: String(progress.total_xp_earned),
      level: String(user?.level ?? 1),
      levelTitle: user?.level_title ?? 'Beginner',
      checkpoints: String((progress.completed_checkpoints as string[])?.length ?? 0),
      completedAt: progress.updated_at,
    });

    const certificateUrl = `${process.env.VERCEL_URL}/certificate?${params.toString()}`;

    return res.status(200).json({ success: true, certificateUrl });
  } catch (err: any) {
    const status = err.message?.includes('token') ? 401 : 500;
    return res.status(status).json({ error: err.message });
  }
}
