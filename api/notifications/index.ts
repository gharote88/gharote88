import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClient, getUserId } from '../_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const userId = await getUserId(req);
    const action = req.query.action as string;

    // POST /api/notifications?action=register
    if (req.method === 'POST' && action === 'register') {
      const { token } = req.body as { token: string };
      if (!token) return res.status(400).json({ error: 'token required' });

      const { data: existing } = await adminClient
        .from('notification_preferences').select('device_tokens').eq('user_id', userId).single();

      const tokens: string[] = existing?.device_tokens ?? [];
      if (!tokens.includes(token)) {
        await adminClient.from('notification_preferences').upsert(
          { user_id: userId, device_tokens: [...tokens, token] },
          { onConflict: 'user_id' }
        );
      }
      return res.status(200).json({ registered: true });
    }

    // GET /api/notifications?action=preferences
    if (req.method === 'GET' && action === 'preferences') {
      const { data } = await adminClient
        .from('notification_preferences').select('*').eq('user_id', userId).single();
      return res.status(200).json(data ?? {
        streak_reminders: true, daily_challenge_alerts: true, fact_of_the_day: true,
      });
    }

    // PUT /api/notifications?action=preferences
    if (req.method === 'PUT' && action === 'preferences') {
      const { streakReminders, dailyChallengeAlerts, factOfTheDay, preferredTime, timezone } = req.body;
      const update: Record<string, any> = { user_id: userId };
      if (streakReminders !== undefined) update.streak_reminders = streakReminders;
      if (dailyChallengeAlerts !== undefined) update.daily_challenge_alerts = dailyChallengeAlerts;
      if (factOfTheDay !== undefined) update.fact_of_the_day = factOfTheDay;
      if (preferredTime !== undefined) update.preferred_time = preferredTime;
      if (timezone !== undefined) update.timezone = timezone;

      await adminClient.from('notification_preferences').upsert(update, { onConflict: 'user_id' });
      return res.status(200).json({ success: true, ...update });
    }

    // POST /api/notifications?action=remove
    if (req.method === 'POST' && action === 'remove') {
      const { token } = req.body as { token: string };
      if (!token) return res.status(400).json({ error: 'token required' });

      const { data: existing } = await adminClient
        .from('notification_preferences').select('device_tokens').eq('user_id', userId).single();
      if (!existing) return res.status(200).json({ removed: false });

      const tokens = (existing.device_tokens ?? []).filter((t: string) => t !== token);
      await adminClient.from('notification_preferences').update({ device_tokens: tokens }).eq('user_id', userId);
      return res.status(200).json({ removed: true });
    }

    return res.status(404).json({ error: 'Unknown action' });
  } catch (err: any) {
    const status = err.message?.includes('token') ? 401 : 500;
    return res.status(status).json({ error: err.message });
  }
}
