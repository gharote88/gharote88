import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClient, getUserId } from '../_lib/supabase';
import { pronunciationScore } from '../_lib/pronunciation';

// Compile-time constants — never derived from user input or environment variables
const HF_API_HOST = 'api-inference.huggingface.co' as const;
const HF_API_URL  = `https://${HF_API_HOST}/models/vasista22/whisper-marathi` as const;

async function transcribeAudio(buffer: Buffer): Promise<string> {
  // Primary: Hugging Face vasista22/whisper-marathi (hardcoded host, no dynamic URL)
  try {
    const res = await fetch(HF_API_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.HF_API_TOKEN}`, 'Content-Type': 'audio/webm' },
      body: buffer,
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`HF error: ${res.status}`);
    const data = await res.json() as { text?: string };
    return data.text?.trim() ?? '';
  } catch {
    // Fallback: Google Cloud STT
    const { SpeechClient } = await import('@google-cloud/speech');
    const credentials = process.env.GOOGLE_CLOUD_KEY_FILE ? JSON.parse(process.env.GOOGLE_CLOUD_KEY_FILE) : undefined;
    const client = new SpeechClient({ credentials, projectId: process.env.GOOGLE_CLOUD_PROJECT_ID });
    const [response] = await client.recognize({
      audio: { content: buffer.toString('base64') },
      config: { encoding: 'WEBM_OPUS', languageCode: 'mr-IN', model: 'default' },
    });
    return response.results?.[0]?.alternatives?.[0]?.transcript?.trim() ?? '';
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const userId = await getUserId(req);
    const { passageId, audioBase64, elapsedSeconds } = req.body as {
      passageId: string; audioBase64: string; elapsedSeconds: number;
    };
    if (!passageId || !audioBase64 || !elapsedSeconds) {
      return res.status(400).json({ error: 'passageId, audioBase64 and elapsedSeconds required' });
    }

    const { data: passage, error } = await adminClient
      .from('reading_passages').select('*').eq('id', passageId).single();
    if (error || !passage) return res.status(404).json({ error: 'Passage not found' });

    const buffer = Buffer.from(audioBase64, 'base64');

    let transcribed = '';
    try {
      transcribed = await transcribeAudio(buffer);
    } catch {
      return res.status(503).json({ error: 'Speech recognition unavailable' });
    }

    const pronunciationAcc = pronunciationScore(passage.content_marathi, transcribed);
    const wpm = Math.round((passage.word_count / elapsedSeconds) * 60);
    const benchmarks: Record<string, number> = { beginner: 20, intermediate: 35, advanced: 50 };
    const wpmScore = Math.min(100, Math.round((wpm / (benchmarks[passage.level] ?? 35)) * 100));
    const fluencyScore = Math.round(pronunciationAcc * 0.7 + wpmScore * 0.3);
    const xpAward = fluencyScore >= 60 ? 20 : 0;
    const now = new Date().toISOString();

    await adminClient.from('reading_progress').upsert({
      user_id: userId, passage_id: passageId,
      status: 'in_progress', read_aloud_score: fluencyScore,
      reading_speed_wpm: wpm, xp_earned: xpAward, updated_at: now,
    }, { onConflict: 'user_id,passage_id' });

    return res.status(200).json({ fluencyScore, pronunciationAccuracy: pronunciationAcc, wpm, xpAward, transcribed });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    const status = message.includes('token') ? 401 : 500;
    return res.status(status).json({ error: message });
  }
}
