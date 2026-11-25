# Marathi Learning App

A cross-platform (Web PWA + iOS + Android) language learning app that teaches spoken, written, and read Marathi to learners aged 10–20. Built with Expo, React Native, Supabase, and Vercel Serverless Functions.

---

## Features

- **Lesson Engine** — Structured lessons across Beginner, Intermediate, and Advanced levels covering speaking, writing, and reading
- **Speaking Practice** — Pronunciation scoring via Web Speech API (web) and Hugging Face Whisper (mobile), with Google Cloud STT fallback and Vosk offline support
- **Writing Practice** — Devanagari character tracing with stroke-order evaluation using Dynamic Time Warping (DTW)
- **Reading Practice** — Graded passages with tap-to-define vocabulary, read-aloud mode, and comprehension quizzes
- **Gamification** — XP, levels, streaks with freeze, collectible badges, daily challenges, weekly leaderboard, and avatar customization
- **Journey Map** — Visual Maharashtra map showing learner progress from a starting city toward Pune, with real-time XP sync
- **Story Mode** — Narrative-driven scenarios combining dialogue, reading, and writing scenes
- **Cultural Trivia** — 100+ fun facts about Maharashtra with a daily fact, favorites, and mini-quizzes
- **Parent Dashboard** — Child progress monitoring with COPPA/UK GDPR controls for under-13 users
- **Offline Support** — Expo SQLite caching + Service Worker for PWA; background sync on reconnect

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile app | Expo (React Native) + expo-router |
| Web PWA | React 18 + Vite 5 |
| API | Vercel Serverless Functions (TypeScript) |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth + Google OAuth |
| Real-time | Supabase Realtime |
| Media storage | Supabase Storage |
| Speech (web) | Web Speech API (`mr-IN`) |
| Speech (mobile primary) | Hugging Face `vasista22/whisper-marathi` |
| Speech (server fallback) | Google Cloud Speech-to-Text |
| Speech (offline mobile) | Vosk via `react-native-vosk` |
| Push notifications | OneSignal |
| Scheduled jobs | GitHub Actions cron |
| CI/CD | GitHub Actions → Vercel + EAS |

All infrastructure runs on free tiers — no credit card required.

---

## Monorepo Structure

```
.
├── api/                        # Vercel Serverless Functions
│   ├── _lib/                   # Shared: Supabase client, DTW, gamification, pronunciation
│   ├── auth/                   # Parent-child account linking
│   ├── fun-facts/              # Cultural trivia endpoints
│   ├── gamification/           # XP, streaks, badges, challenges, leaderboard
│   ├── journey/                # Journey map routes and progress
│   ├── lessons/                # Lesson content and listing
│   ├── mini-games/             # Mini-game data and submission
│   ├── notifications/          # Device token registration and preferences
│   ├── profile/                # Avatar management
│   ├── progress/               # Dashboard and progress saving
│   ├── quizzes/                # Quiz questions and submission
│   ├── reading/                # Reading passages and comprehension
│   ├── speech/                 # Pronunciation evaluation
│   ├── story/                  # Story chapters, scenes, and progress
│   └── writing/                # Devanagari characters and handwriting evaluation
│
├── packages/
│   ├── app/                    # Expo mobile + web app
│   │   ├── app/                # expo-router screens (file-based routing)
│   │   └── src/                # Components, hooks, screens
│   ├── web/                    # React + Vite PWA
│   │   └── src/
│   │       ├── pages/          # All web page components
│   │       ├── components/     # Shared UI components (BottomNav, OfflineBanner, Skeleton, ErrorBoundary, PWAUpdateBanner)
│   │       └── hooks/          # Custom hooks (notifications, offline sync)
│   └── shared/                 # Shared Supabase client and auth utilities
│
├── supabase/
│   └── migrations/             # PostgreSQL schema + seed data (10 files)
│
└── .github/
    └── workflows/              # CI, fact-of-the-day cron, weekly cleanup cron
```

---

## Getting Started

### Prerequisites

- Node.js 20.19.0
- npm 10.8.2
- [Vercel CLI](https://vercel.com/docs/cli): `npm install -g vercel`
- [EAS CLI](https://docs.expo.dev/eas/): `npm install -g eas-cli`
- A [Supabase](https://supabase.com) project (free tier)

### 1. Clone and install

```bash
git clone <repo-url>
cd demo
npm install
```

### 2. Set up environment variables

**API** (`api/.env`):
```bash
cd api
cp .env.example .env
# Fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, HF_API_TOKEN,
# GOOGLE_CLOUD_KEY_FILE, GOOGLE_CLOUD_PROJECT_ID
```

**Expo app** (`packages/app/.env`):
```bash
cd packages/app
cp .env.example .env
# Fill in EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY,
# EXPO_PUBLIC_API_BASE_URL (http://localhost:3000 for local dev)
```

**Web** (`packages/web/.env`):
```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_API_BASE_URL=http://localhost:3000
VITE_VAPID_PUBLIC_KEY=<your-vapid-public-key>
```

### 3. Run database migrations

```bash
supabase db push --db-url postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres
```

Migrations in `supabase/migrations/` run in order:

| File | Contents |
|------|----------|
| `001_initial_schema.sql` | All tables |
| `002_seed_journey_routes.sql` | 5 starting cities + checkpoints |
| `003_seed_badges.sql` | Badge definitions |
| `004_seed_lessons.sql` | Lesson catalogue |
| `005_seed_phrases.sql` | Phrases per lesson |
| `006_seed_quiz_questions.sql` | Quiz questions |
| `007_seed_writing_characters.sql` | Devanagari stroke data |
| `008_rls_policies.sql` | Row Level Security policies |
| `009_seed_fun_facts.sql` | 102 cultural fun facts |
| `010_storage_rls.sql` | Storage bucket RLS |

Enable Supabase Realtime on the `journey_progress` and `users` tables in the Supabase dashboard.

### 4. Start local development

```bash
# API (Vercel dev server at http://localhost:3000)
cd api && vercel dev

# Expo app (in a separate terminal)
cd packages/app && npx expo start

# Web PWA (in a separate terminal)
cd packages/web && npm run dev   # http://localhost:5173
```

Or from the root:

```bash
npm run dev:app   # Expo
npm run dev:web   # Vite web
```

---

## API Endpoints

All routes are Vercel Serverless Functions under `api/`. Protected routes require a Supabase JWT in the `Authorization: Bearer` header.

| Group | Endpoints |
|-------|-----------|
| Auth | `POST /api/auth/link-child`, `POST /api/auth/unlink-child` |
| Lessons | `GET /api/lessons`, `GET /api/lessons/:id` |
| Speech | `POST /api/speech/evaluate` |
| Writing | `GET /api/writing/characters`, `GET /api/writing/lessons/:id`, `POST /api/writing/evaluate`, `GET /api/writing/progress` |
| Reading | `GET /api/reading/passages`, `GET /api/reading/passages/:id`, `POST /api/reading/read-aloud`, `POST /api/reading/comprehension/submit`, `GET /api/reading/progress` |
| Progress | `POST /api/progress`, `GET /api/progress/dashboard`, `GET /api/progress/child-dashboard` |
| Journey | `GET /api/journey/routes`, `POST /api/journey/start`, `GET /api/journey/get`, `POST /api/journey/update`, `GET /api/journey/checkpoints/:id` |
| Gamification | `GET/POST /api/gamification/xp`, `GET /api/gamification/badges`, `GET/POST /api/gamification/streak`, `POST /api/gamification/streak/freeze`, `GET /api/gamification/challenge/today`, `POST /api/gamification/challenge/complete`, `GET /api/gamification/leaderboard` |
| Quizzes | `GET /api/quizzes/lesson/:lessonId`, `POST /api/quizzes/submit` |
| Mini-games | `GET /api/mini-games/:type`, `POST /api/mini-games/:type/submit` |
| Story | `GET /api/story/chapters`, `GET /api/story/chapters/:id/scenes`, `POST /api/story/progress` |
| Fun Facts | `GET /api/fun-facts?action=today`, `GET /api/fun-facts?action=random`, `GET /api/fun-facts?action=favorites`, `POST /api/fun-facts?action=toggle`, `POST /api/fun-facts?action=quiz` |
| Profile | `GET /api/profile/avatar`, `PUT /api/profile/avatar`, `POST /api/profile/avatar/unlock` |
| Notifications | `GET /api/notifications/preferences`, `PUT /api/notifications/preferences`, `POST /api/notifications/register-device` |

---

## CI/CD

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push to `main`:

1. Lint + type-check
2. Build
3. Deploy API to Vercel (production)

### Cron jobs

| Workflow | Schedule | Purpose |
|----------|----------|---------|
| `fact-of-the-day.yml` | Daily 03:30 UTC (9 AM IST) | Rotate daily fun fact |
| `scheduled-cleanup.yml` | Weekly Monday 00:00 UTC | Leaderboard aggregation + streak resets |

### Required GitHub secrets

| Secret | Description |
|--------|-------------|
| `VERCEL_TOKEN` | Vercel account token |
| `VERCEL_ORG_ID` | Vercel org ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |
| `EXPO_TOKEN` | Expo access token |
| `SUPABASE_DB_URL` | Production Supabase connection string |
| `HF_API_TOKEN` | Hugging Face API token |

---

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the full production deployment guide covering Supabase, Vercel, Expo EAS, and secret rotation.

---

## Security

- Supabase JWT verified on every protected API route
- Row Level Security (RLS) enforced on all Supabase tables
- Rate limiting: 100 requests/minute per authenticated user
- Input validation via Zod on all request bodies
- HTTP security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`) via `vercel.json`
- COPPA compliance: under-13 users have social features restricted; leaderboard shows first name + last initial only, no avatar exposed
- Offline sync queue validates all replayed URLs against the page origin before fetch (SSRF prevention)
- Push notification endpoints validated as HTTPS before registration
- PWA service worker auto-update prompt via in-app banner (`PWAUpdateBanner`)

---

## License

Private — all rights reserved.
