import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'Marathi Learning App',
        short_name: 'LearnMarathi',
        description: 'Learn to speak, read, and write Marathi',
        theme_color: '#FF6B35',
        background_color: '#FFFFFF',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 200 * 1024 * 1024, // 200 MB budget
        runtimeCaching: [
          // App shell — cache first
          {
            urlPattern: /\.(html|js|css|woff2?)$/,
            handler: 'CacheFirst',
            options: { cacheName: 'app-shell', expiration: { maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 } },
          },
          // Audio files — cache first, long TTL
          {
            urlPattern: /^https:\/\/.*\.cloudfront\.net\/audio\/.*/,
            handler: 'CacheFirst',
            options: { cacheName: 'audio-cache', expiration: { maxEntries: 300, maxAgeSeconds: 7 * 24 * 60 * 60 } },
          },
          // Google Fonts
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com/,
            handler: 'CacheFirst',
            options: { cacheName: 'fonts-cache', expiration: { maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 } },
          },
          // Lesson / writing / reading content — stale-while-revalidate
          {
            urlPattern: /\/api\/(lessons|writing|reading|fun-facts|story).*/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'content-cache', expiration: { maxEntries: 200, maxAgeSeconds: 24 * 60 * 60 } },
          },
          // Progress / gamification / auth — network first, fall back to cache
          {
            urlPattern: /\/api\/(progress|gamification|auth|profile).*/,
            handler: 'NetworkFirst',
            options: { cacheName: 'api-cache', expiration: { maxEntries: 50, maxAgeSeconds: 5 * 60 }, networkTimeoutSeconds: 5 },
          },
        ],
      },
    }),
  ],
});
