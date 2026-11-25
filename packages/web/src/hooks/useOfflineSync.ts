import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

const DB_NAME = 'marathi-sync-queue';
const STORE = 'pending';
const DB_VERSION = 1;

export interface QueuedRequest {
  id: string;          // referenceId — used for idempotency
  url: string;
  method: string;
  body: string;
  timestamp: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function enqueueRequest(item: QueuedRequest): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function dequeueAll(): Promise<QueuedRequest[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function removeItem(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Only replay requests to our own API origin — blocks SSRF via poisoned queue entries */
function isSafeQueueUrl(url: string): boolean {
  try {
    // Reject protocol-relative URLs and anything that doesn't start with http(s)://
    if (!/^https?:\/\//i.test(url)) return false;
    const parsed = new URL(url);
    // Enforce https-only in production; allow http only on localhost
    const isLocalhost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
    if (parsed.protocol !== 'https:' && !isLocalhost) return false;
    // Must target the same origin as the page (our Vercel API)
    if (parsed.origin !== window.location.origin) return false;
    // Must be an /api/ path — never replay arbitrary same-origin paths
    if (!parsed.pathname.startsWith('/api/')) return false;
    return true;
  } catch {
    return false;
  }
}

async function replayQueue(): Promise<number> {
  const items = await dequeueAll();
  let replayed = 0;
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? null;
  for (const item of items) {
    // Skip any queue entry whose URL doesn't point to our own origin
    if (!isSafeQueueUrl(item.url)) {
      await removeItem(item.id);
      continue;
    }
    try {
      // Validate body is well-formed JSON before replaying — prevents XSS via stored malicious payloads
      let safeBody: string;
      try {
        safeBody = JSON.stringify(JSON.parse(item.body));
      } catch {
        await removeItem(item.id);
        continue;
      }
      // Sanitize method to a known-safe set
      const safeMethod = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(item.method.toUpperCase())
        ? item.method.toUpperCase()
        : null;
      if (!safeMethod) {
        await removeItem(item.id);
        continue;
      }
      const res = await fetch(item.url, {
        method: safeMethod,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: safeBody,
      });
      // Remove from queue on success or 4xx (non-retryable)
      if (res.ok || (res.status >= 400 && res.status < 500)) {
        await removeItem(item.id);
        replayed++;
      }
    } catch {
      // Network still down — leave in queue
    }
  }
  return replayed;
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const syncing = useRef(false);

  // Refresh pending count
  async function refreshCount() {
    const items = await dequeueAll().catch(() => []);
    setPendingCount(items.length);
  }

  useEffect(() => {
    refreshCount();

    function handleOnline() {
      setIsOnline(true);
      if (syncing.current) return;
      syncing.current = true;
      replayQueue()
        .then(count => { if (count > 0) refreshCount(); })
        .finally(() => { syncing.current = false; });
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Replay on mount if online and queue has items
    if (navigator.onLine) handleOnline();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, pendingCount, refreshCount };
}
