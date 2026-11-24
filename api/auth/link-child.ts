import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClient, getUserId } from '../_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const parentId = await getUserId(req);
    const { childEmail } = req.body as { childEmail: string };
    if (!childEmail) return res.status(400).json({ error: 'childEmail required' });

    // Verify caller is a parent
    const { data: parent } = await adminClient
      .from('users')
      .select('role')
      .eq('id', parentId)
      .single();

    if (parent?.role !== 'parent') {
      return res.status(403).json({ error: 'Only parent accounts can link children' });
    }

    // Look up child by email via auth admin API
    const { data: { users }, error: lookupErr } = await adminClient.auth.admin.listUsers();
    if (lookupErr) throw lookupErr;

    const childAuthUser = users.find((u) => u.email === childEmail.toLowerCase().trim());
    if (!childAuthUser) return res.status(404).json({ error: 'No account found with that email' });

    // Verify child is under_13 or has child role
    const { data: childProfile } = await adminClient
      .from('users')
      .select('id, display_name, role, under_13')
      .eq('id', childAuthUser.id)
      .single();

    if (!childProfile) return res.status(404).json({ error: 'Child profile not found' });
    if (childProfile.role !== 'child') {
      return res.status(400).json({ error: 'That account is not a child account' });
    }

    // Idempotent upsert
    const { error: linkErr } = await adminClient
      .from('parent_child_links')
      .upsert(
        { parent_id: parentId, child_id: childProfile.id, linked_at: new Date().toISOString() },
        { onConflict: 'parent_id,child_id', ignoreDuplicates: true }
      );

    if (linkErr) throw linkErr;

    return res.status(200).json({
      success: true,
      child: {
        id: childProfile.id,
        name: childProfile.display_name,
        email: childEmail,
        under13: childProfile.under_13,
      },
    });
  } catch (err: any) {
    const status = err.message?.includes('token') ? 401 : 500;
    return res.status(status).json({ error: err.message });
  }
}
