import type { VercelRequest, VercelResponse } from '@vercel/node';
import { SpeechClient } from '@google-cloud/speech';
import { adminClient, getUserId } from '../_lib/supabase';
import { pronunciationScore } from '../_lib/pronunciation';

const HF_API_URL = 'https://api-inference.huggingface.co/models/vasista22/whisper-marathi';
const HF_TOKEN = process.env.HF_API_TOKEN!;

type TranscribeResult = {
  transcription: string;
  confidence: number;
  provider: 'huggingface' | 'google' | 'web';
};

// Primary: Hugging Face vasista22/whisper-marathi (free tier)
async function transcribeWithHF(buffer: Buffer): Promise<TranscribeResult> {
  const response = await fetch(HF_API_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${HF_TOKEN}`, 'Content-Type': 'audio/wav' },
    body: buffer,
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`HF API error: ${response.status}`);
  const data = await response.json() as { text?: string };
  return {
    transcription: data.text?.trim() ?? '',
    confidence: 0.9, // HF doesn't return per-segment confidence
    provider: 'huggingface',
  };
}

// Fallback: Google Cloud Speech-to-Text (60 min/month free)
async function transcribeWithGoogle(buffer: Buffer): Promise<TranscribeResult> {
  const keyFileJson = process.env.GOOGLE_CLOUD_KEY_FILE;
  const credentials = keyFileJson ? JSON.parse(keyFileJson) : undefined;
  const client = new SpeechClient({
    credentials,
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  });
  const [response] = await client.recognize({
    audio: { content: buffer.toString('base64') },
    config: { encoding: 'LINEAR16', languageCode: 'mr-IN', model: 'default' },
  });
  const result = response.results?.[0]?.alternatives?.[0];
  return {
    transcription: result?.transcript?.trim() ?? '',
    confidence: result?.confidence ?? 0.8,
    provider: 'google',
  };
}

async function transcribeBuffer(buffer: Buffer): Promise<TranscribeResult> {
  try {
    return await transcribeWithHF(buffer);
  } catch {
    return await transcribeWithGoogle(buffer);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const userId = await getUserId(req);
    const action = req.query.action as string;

    // POST /api/speech?action=evaluate
    // Handles both web (transcript from Web Speech API) and mobile (raw audio)
    if (action === 'evaluate') {
      const { transcript, audioData, expectedPhrase, referenceId } = req.body as {
        transcript?: string;       // from Web Speech API (web PWA)
        audioData?: string;        // base64 audio (mobile)
        expectedPhrase: string;
        referenceId: string;
      };

      if (!expectedPhrase) return res.status(400).json({ error: 'expectedPhrase required' });
      if (!transcript && !audioData) return res.status(400).json({ error: 'transcript or audioData required' });

      const start = Date.now();
      let result: TranscribeResult;

      if (transcript) {
        // Web path: transcript already provided by Web Speech API client-side
        result = { transcription: transcript.trim(), confidence: 0.95, provider: 'web' };
      } else {
        const buffer = Buffer.from(audioData!, 'base64');
        result = await transcribeBuffer(buffer);
      }

      const baseScore = pronunciationScore(expectedPhrase, result.transcription);
      const confidenceBonus = result.confidence > 0.8 ? 10 : 0;
      const score = Math.min(100, baseScore + confidenceBonus);
      const processingTime = Date.now() - start;

      await adminClient.from('transcription_logs').insert({
        user_id: userId, provider: result.provider,
        confidence: result.confidence, processing_time_ms: processingTime,
        created_at: new Date().toISOString(),
      });

      return res.status(200).json({
        transcription: result.transcription,
        score,
        confidence: result.confidence,
        provider: result.provider,
        processingTime,
        referenceId,
      });
    }

    // POST /api/speech?action=transcribe (raw transcription, no scoring)
    if (action === 'transcribe') {
      const { audioData } = req.body as { audioData: string };
      if (!audioData) return res.status(400).json({ error: 'audioData required' });

      const start = Date.now();
      const result = await transcribeBuffer(Buffer.from(audioData, 'base64'));
      const processingTime = Date.now() - start;

      await adminClient.from('transcription_logs').insert({
        user_id: userId, provider: result.provider,
        confidence: result.confidence, processing_time_ms: processingTime,
        created_at: new Date().toISOString(),
      });

      return res.status(200).json({ ...result, processingTime });
    }

    // POST /api/speech?action=batch
    if (action === 'batch') {
      const { audioFiles } = req.body as { audioFiles: string[] };
      if (!Array.isArray(audioFiles) || !audioFiles.length)
        return res.status(400).json({ error: 'audioFiles array required' });
      if (audioFiles.length > 10)
        return res.status(400).json({ error: 'Maximum 10 files per batch' });

      const settled = await Promise.allSettled(
        audioFiles.map((d) => transcribeBuffer(Buffer.from(d, 'base64')))
      );

      const results = settled
        .filter((r): r is PromiseFulfilledResult<TranscribeResult> => r.status === 'fulfilled')
        .map((r) => r.value);
      const errors = settled
        .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
        .map((r) => ({ error: r.reason?.message ?? 'Unknown error' }));

      return res.status(200).json({
        results, errors,
        summary: { total: audioFiles.length, successful: results.length, failed: errors.length },
      });
    }

    return res.status(404).json({ error: 'Unknown action' });
  } catch (err: any) {
    const status = err.message?.includes('token') ? 401 : 500;
    return res.status(status).json({ error: err.message });
  }
}
