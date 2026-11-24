import { useEffect, useRef, useState } from 'react';

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

async function replayQueue(): Promise<number> {
  const items = await dequeueAll();
  let replayed = 0;
  for (const item of items) {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(item.url, {
        method: item.method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: item.body,
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
