import { createClient } from '@supabase/supabase-js';
import type { VercelRequest } from '@vercel/node';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Service-role client for admin operations (bypasses RLS)
export const adminClient = createClient(supabaseUrl, supabaseServiceKey);

// Verify the Bearer token from the request and return the user id
export async function getUserId(req: VercelRequest): Promise<string> {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) throw new Error('Missing authorization token');

  const { data: { user }, error } = await adminClient.auth.getUser(token);
  if (error || !user) throw new Error('Invalid or expired token');

  return user.id;
}
