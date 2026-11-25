import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClient, getUserId } from '../_lib/supabase';

// POST /api/auth/unlink-child — remove parent→child link
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const parentId = await getUserId(req);
    const { childId } = req.body as { childId: string };
    if (!childId) return res.status(400).json({ error: 'childId required' });

    const { error } = await adminClient
      .from('parent_child_links')
      .delete()
      .eq('parent_id', parentId)
      .eq('child_id', childId);

    if (error) throw error;
    return res.status(200).json({ success: true });
  } catch (err: any) {
    const status = err.message?.includes('token') ? 401 : 500;
    return res.status(status).json({ error: err.message });
  }
}
