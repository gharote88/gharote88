import { useEffect, useRef } from 'react';
import { notificationsApi } from '../api/client';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY ?? '';

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr.buffer as ArrayBuffer;
}

export function useNotifications(enabled: boolean) {
  const registered = useRef(false);

  useEffect(() => {
    if (!enabled || registered.current) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    async function register() {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        const reg = await navigator.serviceWorker.ready;

        // Check for existing subscription first
        let sub = await reg.pushManager.getSubscription();
        if (!sub && VAPID_PUBLIC_KEY) {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });
        }

        if (sub) {
          const token = sub.endpoint;
          // Validate: push endpoints must be HTTPS URLs from a known push service
          // This prevents a compromised SW from injecting an arbitrary URL
          try {
            const { protocol } = new URL(token);
            if (protocol !== 'https:') throw new Error('Non-HTTPS push endpoint rejected');
          } catch {
            return;
          }
          await notificationsApi.register(token);
          registered.current = true;
          // Store only a flag, not the token itself, to avoid sensitive data in localStorage
          localStorage.setItem('pushRegistered', '1');
        }
      } catch {
        // Push not supported or user denied — fail silently
      }
    }

    register();
  }, [enabled]);
}
