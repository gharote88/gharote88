import { useEffect, useRef } from 'react';
import * as SQLite from 'expo-sqlite';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '@marathi-learning/shared';

const DB_NAME = 'marathi_cache.db';

async function getDb() {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS lessons_cache (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      cached_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS pending_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payload TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);
  return db;
}

export async function cacheLessons(lessons: any[]) {
  const db = await getDb();
  const now = Date.now();
  for (const lesson of lessons) {
    await db.runAsync(
      'INSERT OR REPLACE INTO lessons_cache (id, data, cached_at) VALUES (?, ?, ?)',
      [lesson.id, JSON.stringify(lesson), now]
    );
  }
}

export async function getCachedLessons(): Promise<any[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ data: string }>('SELECT data FROM lessons_cache ORDER BY cached_at DESC');
  return rows.map(r => JSON.parse(r.data));
}

export async function queueProgress(payload: object) {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO pending_progress (payload, created_at) VALUES (?, ?)',
    [JSON.stringify(payload), Date.now()]
  );
}

async function flushPendingProgress() {
  const db = await getDb();
  const rows = await db.getAllAsync<{ id: number; payload: string }>('SELECT id, payload FROM pending_progress ORDER BY created_at ASC');
  if (rows.length === 0) return;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  for (const row of rows) {
    try {
      // Re-serialize to strip any injected non-JSON content before replaying
      let safePayload: string;
      try {
        safePayload = JSON.stringify(JSON.parse(row.payload));
      } catch {
        await db.runAsync('DELETE FROM pending_progress WHERE id = ?', [row.id]);
        continue;
      }
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: safePayload,
      });
      if (res.ok) {
        await db.runAsync('DELETE FROM pending_progress WHERE id = ?', [row.id]);
      }
    } catch {
      break; // still offline, stop trying
    }
  }
}

export function useOfflineCache() {
  const wasOffline = useRef(false);

  useEffect(() => {
    const unsub = NetInfo.addEventListener(state => {
      const online = state.isConnected && state.isInternetReachable;
      if (online && wasOffline.current) {
        flushPendingProgress().catch(console.error);
      }
      wasOffline.current = !online;
    });
    return unsub;
  }, []);
}
