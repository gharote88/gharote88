import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClient, getUserId } from '../_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await getUserId(req);

    const { data, error } = await adminClient
      .from('journey_routes')
      .select('id, start_city, start_city_marathi, target_city, description, distance_km, total_xp_required, checkpoints')
      .order('distance_km');

    if (error) throw error;

    return res.status(200).json({
      routes: (data ?? []).map((r) => ({
        id: r.id,
        startCity: r.start_city,
        startCityMarathi: r.start_city_marathi,
        targetCity: r.target_city,
        description: r.description,
        distanceToPune: r.distance_km,
        estimatedDuration: Math.ceil(r.distance_km / 50),
        totalXpRequired: r.total_xp_required,
        checkpointCount: (r.checkpoints as any[])?.length ?? 0,
        // Fields expected by CitySelectionScreen
        name: r.start_city,
        marathiName: r.start_city_marathi,
        culturalHighlights: [],
        imageUrl: '',
        position: (r.checkpoints as any[])?.[0]?.position ?? { x: 0, y: 0 },
      })),
    });
  } catch (err: any) {
    const status = err.message?.includes('token') ? 401 : 500;
    return res.status(status).json({ error: err.message });
  }
}
