# Spec-Driven Development Alignment Plan

## Status: Migration Complete

All 39 implementation tasks are complete. The app has been fully migrated from the original Firebase/Prisma/Express architecture to the current Supabase/Vercel/Expo stack.

---

## Delivered Architecture

### ✅ Database & Auth
- **Supabase PostgreSQL** — all tables per `design.md` data models
- **Supabase Auth** — Google SSO, JWT session management, `under_13` column for COPPA
- **Supabase Realtime** — live subscriptions on `journey_progress` and `users` tables
- **Supabase Storage** — `audio`, `images`, `avatars` buckets
- **Row Level Security** — complete RLS policies in `supabase/migrations/008_rls_policies.sql`

### ✅ API Layer
- **Vercel Serverless Functions** — all routes under `api/`
- Auth, lessons, speech, writing, reading, gamification, journey, story, fun-facts, notifications, profile, progress, quizzes, mini-games
- Supabase JWT verification on all protected routes via `api/_lib/supabase.ts`
- Zod input validation, CORS headers, rate limiting, security headers via `vercel.json`

### ✅ Speech Recognition
- **Web**: Browser Web Speech API (`mr-IN`) — free, client-side, no server call
- **Mobile/Server primary**: Hugging Face `vasista22/whisper-marathi` — free tier
- **Server fallback**: Google Cloud Speech-to-Text (`mr-IN`) — 60 min/month free
- **Offline mobile**: Vosk via `react-native-vosk` — fully on-device

### ✅ Mobile App (Expo)
- Expo SDK ~50, expo-router file-based routing
- Supabase client for auth + data + realtime
- Full onboarding flow: city selection → route confirmation → avatar → profile → tutorial
- Journey map with SVG, animated avatar, Realtime XP sync
- All lesson, speaking, writing, reading, quiz, gamification, story, fun-facts screens

### ✅ Web PWA
- React 18 + Vite 5
- Supabase client
- Web Speech API for speech recognition
- PWA manifest, Service Worker, offline support

### ✅ CI/CD & Scheduled Jobs
- GitHub Actions CI: lint → type-check → build → deploy to Vercel on merge to `main`
- Cron: `fact-of-the-day.yml` — daily 03:30 UTC
- Cron: `scheduled-cleanup.yml` — weekly Monday 00:00 UTC (leaderboard + streak resets)

---

## Migrations Run

| File | Contents |
|------|----------|
| `001_initial_schema.sql` | All tables |
| `002_seed_journey_routes.sql` | 5 starting cities + checkpoints |
| `003_seed_badges.sql` | Badge definitions |
| `004_seed_lessons.sql` | Lesson catalogue |
| `005_seed_phrases.sql` | Phrases per lesson |
| `006_seed_quiz_questions.sql` | Quiz questions |
| `007_seed_writing_characters.sql` | Devanagari stroke data |
| `008_rls_policies.sql` | Row Level Security |
| `009_seed_fun_facts.sql` | 102 cultural fun facts |

---

## Removed (Firebase Migration)

The following were removed as part of the Firebase → Supabase/Vercel migration:

| Removed | Replaced by |
|---------|-------------|
| Firebase Auth | Supabase Auth + Google OAuth |
| Firestore | Supabase PostgreSQL |
| Firebase Realtime Database | Supabase Realtime |
| Firebase Cloud Storage | Supabase Storage |
| Firebase Cloud Functions (`packages/functions/`) | Vercel Serverless Functions (`api/`) |
| Firebase Cloud Messaging | OneSignal free tier |
| Firebase Hosting | Vercel |
| Firebase Scheduled Functions | GitHub Actions cron |
| OpenAI Whisper API (paid) | HF `vasista22/whisper-marathi` (free) + Google Cloud STT fallback |
| `.firebaserc`, `firebase.json`, `firestore.rules`, `database.rules`, `storage.rules` | Deleted |

---

## Outstanding Items

- [ ] Populate `api/.env` with real `GOOGLE_CLOUD_KEY_FILE` JSON contents
- [ ] Rotate `SUPABASE_SERVICE_ROLE_KEY` (was previously exposed in git)
- [ ] Rotate `HF_API_TOKEN` (was previously exposed in git)
- [ ] Revoke leaked OpenAI key on platform.openai.com (key no longer used)
- [ ] Add all env vars to Vercel dashboard (see `DEPLOYMENT.md` Section 2)
- [ ] Run all migrations against production Supabase project
- [ ] Configure EAS Build profiles for iOS and Android production builds
- [ ] Upload audio, image, and avatar assets to Supabase Storage buckets

---

**Last Updated**: 2026-09-10
**Version**: 2.0
**Status**: Migration Complete — All 39 tasks delivered
