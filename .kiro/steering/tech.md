# Tech Stack

## Languages & Runtime
- TypeScript 5.4 across all packages
- Node.js 20 for Vercel Serverless Functions

## Packages

### `api/` — Vercel Serverless Functions
- `@vercel/node` runtime
- `@supabase/supabase-js` (admin client with service role key)
- `@google-cloud/speech` for STT fallback
- Hugging Face Inference API via plain `fetch` (no SDK)
- Zod for request validation

### `packages/app/` — Mobile (React Native / Expo)
- Expo SDK ~50, expo-router ~3.4 (file-based routing)
- `@supabase/supabase-js` for auth + data + realtime
- `react-native-vosk` for offline speech recognition
- expo-av for audio, expo-haptics, expo-notifications
- lottie-react-native for animations
- React Native Reanimated, Gesture Handler, SVG

### `packages/web/` — Web PWA (React + Vite)
- React 18, Vite 5
- `@supabase/supabase-js` for auth + data + realtime
- Web Speech API (browser-native, no SDK) for speech recognition
- vite-plugin-pwa for PWA support
- Framer Motion for animations

### `packages/shared/` — Shared Types & Auth Helpers
- All TypeScript interfaces and domain types
- Supabase client initialization
- Auth helpers (Google sign-in, session management, age verification)
- Zod for shared validation schemas

### `packages/functions/` — Deleted
Original Firebase Cloud Functions — superseded by `api/` Vercel functions. Removed.

## Build System
- npm workspaces (root `package.json` manages all packages)
- TypeScript compiled via `tsc` per package
- ESLint + Prettier for linting/formatting

## Common Commands

```bash
# Root-level (run from /demo)
npm run dev:web          # Start web dev server (Vite)
npm run dev:app          # Start Expo dev server
npm run build:web        # Build web PWA
npm run build:shared     # Compile shared package (required before others)
npm run lint             # ESLint all packages
npm run format           # Prettier all packages
npm run deploy           # Deploy API to Vercel production

# API (run from /api)
vercel dev               # Local dev server at http://localhost:3000

# Mobile (from /packages/app)
npx expo start           # Start Expo dev server
npx expo run:ios         # Open in iOS simulator
npx expo run:android     # Open in Android emulator
eas build --platform all # Production EAS build
```

## Environment Variables

### API (`api/.env`)
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (never expose client-side)
- `HF_API_TOKEN` — Hugging Face Inference API token
- `GOOGLE_CLOUD_KEY_FILE` — Google Cloud service account JSON (full contents as string)
- `GOOGLE_CLOUD_PROJECT_ID` — Google Cloud project ID

### Mobile (`packages/app/.env`)
- `EXPO_PUBLIC_SUPABASE_URL` — Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key (safe for client)
- `EXPO_PUBLIC_API_BASE_URL` — Vercel API base URL
- `EXPO_PUBLIC_APP_ENV` — `development` or `production`

### Web (`packages/web/.env`)
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anon key
- `VITE_API_BASE_URL` — Vercel API base URL

## Key Conventions
- Zod schemas defined alongside route handlers for request validation
- All DB IDs are UUIDs
- Supabase RLS enforces data access — never bypass with anon key on server
- Server-side always uses `SUPABASE_SERVICE_ROLE_KEY` via `adminClient` in `api/_lib/supabase.ts`
- Client-side always uses `SUPABASE_ANON_KEY` — RLS policies enforce ownership
- XP awards always include a `referenceId` for idempotency
