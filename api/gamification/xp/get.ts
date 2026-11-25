import type { VercelRequest, VercelResponse } from '@vercel/node';
import getHandler from './get';
import awardHandler from './award';
import recordHandler from '../streak/record';

// Unified /api/gamification/xp — GET returns current XP, POST awards XP
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') return getHandler(req, res);
  if (req.method === 'POST') return awardHandler(req, res);
  return res.status(405).json({ error: 'Method not allowed' });
}
