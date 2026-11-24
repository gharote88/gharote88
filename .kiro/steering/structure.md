# Project Structure

## Monorepo Layout

```
demo/
├── api/                  # Vercel Serverless Functions
│   ├── _lib/             # Shared server utilities
│   ├── journey/          # Journey map API routes
│   ├── lessons/          # Lesson API routes
│   ├── speech/           # Speech recognition + scoring
│   ├── writing/          # Handwriting evaluation
│   ├── reading/          # Reading passages + comprehension
│   ├── gamification/     # XP, streaks, badges, leaderboard
│   ├── story/            # Story mode
│   ├── fun-facts/        # Cultural trivia
│   ├── notifications/    # Push notification preferences
│   ├── profile/          # Avatar management
│   ├── progress/         # Progress dashboard
│   ├── quizzes/          # Quiz submission
│   ├── auth/             # Parent-child account linking
│   └── package.json
├── packages/
│   ├── app/              # Mobile app (Expo / React Native)
│   ├── web/              # Web PWA (React + Vite)
│   └── shared/           # Shared types + Supabase auth helpers
├── supabase/
│   └── migrations/       # SQL migration files (run in order)
├── .github/
│   └── workflows/        # CI/CD + cron jobs
├── vercel.json           # Vercel config (rewrites, headers, function timeouts)
├── package.json          # npm workspaces root
├── .eslintrc.json
└── .prettierrc
```

## Package Details

### `api/`
```
_lib/
  supabase.ts       # adminClient (service role) + getUserId() auth helper
  pronunciation.ts  # Levenshtein-based pronunciation scorer
  dtw.ts            # Dynamic Time Warping for handwriting evaluation
  gamification.ts   # XP award + badge evaluation helpers
journey/
  routes.ts         # GET /api/journey/routes
  start.ts          # POST /api/journey/start
  get.ts            # GET /api/journey/progress
  update.ts         # POST /api/journey/update
  checkpoints/
    [id].ts         # GET /api/journey/checkpoints/:id
speech/
  index.ts          # POST /api/speech?action=evaluate|transcribe|batch
```

### `packages/app/`
```
src/
  components/       # JourneyMap, JourneyProgressTracker, LessonPlayer,
  │                 #   SpeakingPractice, WritingPractice
  hooks/            # useJourneyProgression, useAutoJourneyUpdate
  screens/
    onboarding/     # WelcomeScreen, CitySelectionScreen,
    │               #   RouteConfirmationScreen, AvatarSelectionScreen,
    │               #   ProfileSetupScreen, JourneyTutorialScreen
    lessons/        # LessonListScreen, LessonDetailScreen
  supabase.ts       # Supabase client (anon key)
onboarding/         # expo-router entries (re-export from src/screens)
_layout.tsx         # Root layout with auth guard + onboarding redirect
dashboard.tsx       # Main dashboard with journey map
app.json            # Expo config
```

### `packages/web/`
```
src/
  main.tsx          # Vite entry point
  App.tsx           # Root component with routing
  lib/supabase.ts   # Supabase client
  pages/            # All page components
  components/       # BottomNav, OfflineBanner, Skeleton
  hooks/            # useNotifications, useOfflineSync
  store/authStore.ts
```

### `packages/shared/`
```
src/
  index.ts          # All TypeScript types + re-exports
  supabase.ts       # Supabase client init
  supabaseAuth.ts   # Auth helpers (signInWithGoogle, signOut,
                    #   getUserProfile, completeAgeVerification)
```

### `supabase/migrations/`
```
001_initial_schema.sql        # All tables
002_seed_journey_routes.sql   # 5 starting cities + checkpoints
003_seed_badges.sql           # Badge definitions
004_seed_lessons.sql          # Lesson catalogue
005_seed_phrases.sql          # Phrases per lesson
006_seed_quiz_questions.sql   # Quiz questions
007_seed_writing_characters.sql  # Devanagari stroke data
008_rls_policies.sql          # Row Level Security
009_seed_fun_facts.sql        # 102 cultural fun facts
```

## Architecture Patterns

### API Layer
- Each file in `api/` is a standalone Vercel Serverless Function
- Dynamic routes use `[param].ts` filename convention with query param forwarding via `vercel.json` rewrites
- All handlers call `getUserId(req)` from `api/_lib/supabase.ts` to authenticate via Supabase JWT
- Server always uses `adminClient` (service role) — never the anon client

### Data Layer
- **Supabase PostgreSQL** — single source of truth for all data
- **Supabase Realtime** — live subscriptions on `journey_progress` and `users` tables
- **Supabase Storage** — `audio`, `images`, `avatars` buckets (public read)
- RLS policies in `008_rls_policies.sql` enforce all access rules

### Shared Package
- Single source of truth for TypeScript types — import from `@marathi-learning/shared`
- Must be built (`npm run build:shared`) before dependent packages

### Mobile (Expo)
- File-based routing via expo-router (`_layout.tsx` + screen files at root of `packages/app/`)
- Screen components live in `src/screens/`, expo-router entry files re-export them
- Supabase Realtime subscriptions cleaned up in `useEffect` return functions

## Naming Conventions
- Files: `camelCase.ts` / `camelCase.tsx`
- DB table and column names: `snake_case`
- All DB IDs: UUID strings
- New API routes: add file to `api/<resource>/` and add rewrite to `vercel.json` if dynamic
- New screens: add component to `packages/app/src/screens/`, add re-export in `packages/app/<route>.tsx`, register in nearest `_layout.tsx`
