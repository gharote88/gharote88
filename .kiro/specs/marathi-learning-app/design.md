# Design Document

## Overview

The Marathi Language Learning App is a cross-platform (Web PWA + iOS + Android) language learning application built with React Native via Expo. It delivers structured, interactive Marathi lessons covering speaking, writing (Devanagari), and reading skills, underpinned by a deep gamification layer (XP, levels, streaks, leaderboards, badges, story mode).

Authentication is handled via Supabase Auth with Google SSO. Content and user progress are stored in Supabase PostgreSQL with offline persistence via Expo SQLite and Supabase Realtime for live sync. Speech evaluation uses Web Speech API on web (free, browser-native), Hugging Face `vasista22/whisper-marathi` on mobile/server (free tier, primary), Google Cloud STT as server fallback (60 min/month free), and Vosk on-device for offline mobile. Handwriting recognition uses a custom Dynamic Time Warping (DTW) implementation for Devanagari stroke matching. The API layer is implemented as Vercel Serverless Functions. All media is served from Supabase Storage.

The app is COPPA and UK GDPR compliant for users under 13, with parental oversight controls and age-appropriate content restrictions. All infrastructure runs on free tiers — no credit card required.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Client Layer                        │
│  ┌──────────────────────────────────────────────┐   │
│  │  React Native via Expo (Web + iOS + Android)  │   │
│  │  ┌──────────┐  ┌──────────┐  ┌────────────┐  │   │
│  │  │ Journey  │  │ Lessons  │  │Gamification│  │   │
│  │  │   Map    │  │  Engine  │  │   System   │  │   │
│  │  └──────────┘  └──────────┘  └────────────┘  │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────┐
│                    API Layer                         │
│          Vercel Serverless Functions (/api/**)        │
│  ┌────────┐ ┌────────┐ ┌──────┐ ┌────────┐         │
│  │Lessons │ │Progress│ │ Auth │ │ Speech │         │
│  │Service │ │Service │ │Service│ │Service │         │
│  └────────┘ └────────┘ └──────┘ └────────┘         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────┐ │
│  │ Writing │ │ Reading │ │Fun Facts│ │Gamific.  │ │
│  │ Service │ │ Service │ │ Service │ │ Service  │ │
│  └─────────┘ └─────────┘ └─────────┘ └──────────┘ │
│  ┌──────────────────┐                               │
│  │ Journey & Story  │                               │
│  │    Service       │                               │
│  └──────────────────┘                               │
└─────────────────────────┬───────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────┐
│                    Data Layer                         │
│  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌─────────┐│
│  │Supabase  │ │HuggingFace│ │ Google   │ │Supabase ││
│  │PostgreSQL│ │  Whisper  │ │ Cloud STT│ │ Storage ││
│  │+ Realtime│ │ (primary) │ │(fallback)│ │(media)  ││
│  └──────────┘ └───────────┘ └──────────┘ └─────────┘│
└─────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Cross-Platform Client | React Native via Expo | Single codebase for Web, iOS, and Android; rapid development; hot reloading |
| Web Frontend | Expo Web (React) | Progressive Web App support; installable from browser |
| Mobile | Expo (React Native) | iOS App Store + Google Play Store distribution; OTA updates |
| API | Vercel Serverless Functions | Free tier; no CC required; TypeScript support; replaces Firebase Cloud Functions |
| Database | Supabase PostgreSQL | Free tier (500MB); Row Level Security replaces Firestore rules; no CC required |
| Real-time Sync | Supabase Realtime | Free tier; replaces Firebase Realtime Database for live XP/journey sync |
| Auth | Supabase Auth + Google OAuth | Free; Google SSO; `under_13` column replaces Firebase custom claims |
| Speech Recognition (Web) | Web Speech API (`mr-IN`) | Free, browser-native, zero server cost; no API key required |
| Speech Recognition (Mobile/Server) | Hugging Face `vasista22/whisper-marathi` | Free tier; Marathi-fine-tuned Whisper model; replaces paid OpenAI Whisper API |
| Speech Fallback | Google Cloud Speech-to-Text (`mr-IN`) | 60 min/month free tier; server-side fallback when HF is unavailable |
| Speech Offline (Mobile) | Vosk (`vosk-model-small-mr`) | Fully offline, open-source, runs on-device via `react-native-vosk` |
| Media Storage | Supabase Storage | Free tier (1GB); replaces Firebase Cloud Storage |
| Push Notifications | OneSignal free tier | Replaces Firebase Cloud Messaging; no CC required |
| Scheduled Jobs | GitHub Actions cron | Free; replaces Firebase Scheduled Functions |
| Hosting (Web) | Vercel | Free tier; replaces Firebase Hosting |
| Mobile Distribution | Expo Go (dev) + EAS (prod) | Expo Go for free testing; EAS for App Store/Play Store |
| Analytics | Supabase built-in + Sentry free tier | Replaces Firebase Analytics + Crashlytics |
| Animations | Expo Animations + Lottie | Smooth transitions; celebration effects |
| CI/CD | GitHub Actions | Automated testing and deployment; free |
| Offline Support | Expo SQLite + AsyncStorage | Local data caching; offline lessons |

---

## Authentication Flow (Google SSO + Supabase)

```
User clicks "Sign in with Google"
         │
         ▼
Supabase Auth triggers Google OAuth 2.0
         │
         ▼
Google OAuth consent screen
         │
         ▼
Supabase Auth receives Google credentials
         │
         ▼
Supabase creates/authenticates user
         ├── New user → Insert row into `users` table, prompt age verification
         └── Existing user → Retrieve user data from Supabase
         │
         ▼
Supabase issues JWT session token
         │
         ▼
Client stores Supabase session, user enters app
         │
         ▼
Real-time sync via Supabase Realtime on `journey_progress` table
```

---

## Components and Interfaces

### Client Components

**Journey Map**
Renders the visual map of the learner's route from their starting city toward Pune. Displays checkpoints, locked/unlocked lesson nodes, and the learner's current position. Reads from the `journey_routes` table and `journey_progress` table via Supabase client.

**Lessons Engine**
Orchestrates the lesson flow: intro → phrases (listen & repeat) → writing exercise → reading passage → mini-game → quiz. Manages local lesson state, audio playback, and submits progress to the API on completion.

**Gamification System**
Renders XP bar, level/title, streak counter, badge notifications, and leaderboard. Subscribes to real-time updates from Supabase Realtime on the `journey_progress` table for live XP/position changes.

---

### API Services

**Auth Service** (`/api/auth/*`)
Handles Google ID token verification via Supabase Auth, user creation/login, JWT session management, and parent-child account linking.

**Lessons Service** (`/api/lessons/*`)
Serves lesson content (phrases, quiz questions) paginated by level. Handles lesson progress saves. Reads from Supabase `lessons` and `phrases` tables.

**Speech Service** (`/api/speech/evaluate`)
Accepts audio input. On web, the client uses the browser Web Speech API (`mr-IN`) directly and sends the transcript for scoring. On mobile, routes server-side to Hugging Face Inference API (`vasista22/whisper-marathi`, free tier) as primary, falls back to Google Cloud STT (`mr-IN`, 60 min/month free) on timeout or error. Offline mobile uses Vosk on-device. Computes pronunciation score using Levenshtein distance on Devanagari text and returns a 0–100 score with XP award.

**Writing Service** (`/api/writing/*`)
Serves Devanagari character stroke data, writing lesson content, and evaluates submitted stroke paths using Dynamic Time Warping (DTW). Returns accuracy score (0–100) and XP.

**Reading Service** (`/api/reading/*`)
Serves graded reading passages with vocabulary and comprehension questions. Evaluates read-aloud audio via the speech pipeline, computes fluency score (pronunciation accuracy + WPM), and scores comprehension answers.

**Progress Service** (`/api/progress/*`)
Saves lesson/quiz/activity completion records. Aggregates dashboard data (streak, XP, next lesson recommendation).

**Gamification Service** (`/api/gamification/*`)
Manages XP transactions, level computation, badge evaluation (event-driven on XP write), daily challenges, and weekly leaderboard ranking.

**Fun Facts Service** (`/api/fun-facts/*`)
Delivers daily fact, random contextual facts, and processes fact quiz submissions. Manages user favorites.

**Mini-Games & Story Service** (`/api/mini-games/*`, `/api/story/*`)
Serves game config by type, processes game results, awards XP. Manages story chapter/scene delivery and scene-level progress persistence.

**Notifications Service** (`/api/notifications/*`)
Manages OneSignal device token registration and per-category notification preferences. GitHub Actions cron jobs handle scheduled delivery (streak reminders, daily challenge, Fact of the Day).

**Profile & Avatar Service** (`/api/profile/*`)
Manages avatar item inventory, equipped items, and XP-based avatar unlocks.

---

## Data Models

### users table
```sql
users
├── id: uuid (references auth.users)
├── name: text
├── email: text
├── avatar_url: text
├── google_id: text (unique)
├── age: integer
├── under_13: boolean (replaces Firebase custom claim)
├── role: text ("learner" | "parent")
├── parent_id: uuid (references users.id, optional)
├── total_xp: integer
├── level: integer
├── level_title: text
├── current_streak: integer
├── longest_streak: integer
├── last_activity_date: timestamptz
├── streak_freeze_available: boolean
├── streak_freeze_used_at: timestamptz
├── equipped_items: text[]
├── unlocked_items: text[]
├── notification_streak_reminders: boolean
├── notification_daily_challenge: boolean
├── notification_fact_of_day: boolean
├── notification_preferred_time: text
├── notification_timezone: text
├── created_at: timestamptz
└── updated_at: timestamptz
```

### lessons table
```sql
lessons
├── id: uuid
├── title: text
├── title_marathi: text
├── level: text ("beginner" | "intermediate" | "advanced")
├── topic: text
├── order_index: integer
├── estimated_minutes: integer
├── xp_reward: integer
├── associated_trivia_id: uuid (references fun_facts.id)
├── reading_passage_id: uuid (references reading_passages.id)
├── mini_game_id: uuid (references mini_games.id)
└── writing_character_ids: uuid[]
```

### phrases table
```sql
phrases
├── id: uuid
├── lesson_id: uuid (references lessons.id)
├── marathi_text: text
├── transliteration: text
├── english_meaning: text
├── audio_url: text (Supabase Storage path)
└── order_index: integer
```

### journey_routes table
```sql
journey_routes
├── id: uuid
├── start_city: text
├── start_city_marathi: text
├── target_city: text
├── description: text
├── distance_km: integer
├── checkpoints: jsonb[]
└── total_xp_required: integer
```

### journey_progress table
```sql
journey_progress
├── id: uuid
├── user_id: uuid (references users.id)
├── route_id: uuid (references journey_routes.id)
├── start_city: text
├── current_checkpoint_index: integer
├── completed_checkpoints: text[]
├── current_position: jsonb ({x, y})
├── total_xp_earned: integer
├── progress_percentage: numeric
├── status: text ("in_progress" | "completed")
├── started_at: timestamptz
├── completed_at: timestamptz
└── updated_at: timestamptz
```

### lesson_progress table
```sql
lesson_progress
├── id: uuid
├── user_id: uuid (references users.id)
├── lesson_id: uuid (references lessons.id)
├── status: text ("not_started" | "in_progress" | "completed")
├── score: integer
├── xp_earned: integer
├── completed_at: timestamptz
└── updated_at: timestamptz
```

### xp_transactions table
```sql
xp_transactions
├── id: uuid
├── user_id: uuid (references users.id)
├── xp_amount: integer
├── source: text ("lesson" | "quiz" | "speaking" | "writing" | "reading" | "daily_challenge" | "streak_bonus" | "fact_quiz" | "mini_game")
├── reference_id: text (idempotency key)
└── created_at: timestamptz
```

### writing_characters table
```sql
writing_characters
├── id: uuid
├── character: text
├── type: text ("vowel" | "consonant" | "conjunct")
├── transliteration: text
├── stroke_data: jsonb[]
├── audio_url: text
├── lesson_id: uuid
├── level: text
└── order_index: integer
```

### writing_progress table
```sql
writing_progress
├── id: uuid
├── user_id: uuid (references users.id)
├── character_id: uuid (references writing_characters.id)
├── accuracy_score: integer
├── attempts: integer
├── mastered: boolean
└── last_practiced_at: timestamptz
```

### reading_passages table
```sql
reading_passages
├── id: uuid
├── title: text
├── title_marathi: text
├── lesson_id: uuid
├── level: text
├── type: text ("words" | "sentences" | "paragraph" | "story")
├── content_marathi: text
├── content_transliteration: text
├── content_english: text
├── audio_url: text
├── word_count: integer
├── order_index: integer
└── estimated_minutes: integer
```

### reading_progress table
```sql
reading_progress
├── id: uuid
├── user_id: uuid (references users.id)
├── passage_id: uuid (references reading_passages.id)
├── status: text
├── comprehension_score: integer
├── reading_speed_wpm: integer
├── read_aloud_score: integer
├── xp_earned: integer
└── completed_at: timestamptz
```

### badges table
```sql
badges
├── id: uuid
├── name: text
├── description: text
├── icon_url: text (Supabase Storage)
├── criteria: jsonb
└── xp_reward: integer
```

### user_badges table
```sql
user_badges
├── id: uuid
├── user_id: uuid (references users.id)
├── badge_id: uuid (references badges.id)
└── earned_at: timestamptz
```

### daily_challenges table
```sql
daily_challenges
├── id: uuid
├── date: date (unique)
├── title: text
├── description: text
├── challenge_type: text ("quiz" | "speaking" | "writing" | "reading" | "mini_game")
├── config: jsonb
├── xp_reward: integer
└── created_at: timestamptz
```

### challenge_completions table
```sql
challenge_completions
├── id: uuid
├── user_id: uuid (references users.id)
├── challenge_id: uuid (references daily_challenges.id)
├── score: integer
├── xp_earned: integer
└── completed_at: timestamptz
```

### leaderboard table
```sql
leaderboard
├── id: uuid
├── user_id: uuid (references users.id)
├── week_start: date
├── weekly_xp: integer
└── rank: integer
```

### avatar_items table
```sql
avatar_items
├── id: uuid
├── category: text ("hair" | "outfit" | "accessory" | "background")
├── name: text
├── image_url: text (Supabase Storage)
├── xp_cost: integer
└── level_required: integer
```

### mini_games table
```sql
mini_games
├── id: uuid
├── type: text
├── lesson_id: uuid
├── level: text
├── config: jsonb
└── xp_reward: integer
```

### story_chapters table
```sql
story_chapters
├── id: uuid
├── title: text
├── title_marathi: text
├── description: text
├── order_index: integer
├── character_name: text
├── character_image_url: text
└── required_level: integer
```

### story_scenes table
```sql
story_scenes
├── id: uuid
├── chapter_id: uuid (references story_chapters.id)
├── narrative_text: text
├── narrative_marathi: text
├── scene_type: text ("dialogue" | "read_sign" | "write_note" | "mixed")
├── dialogue_options: jsonb[]
├── reading_content: text
├── writing_prompt: text
├── correct_option_index: integer
├── order_index: integer
└── xp_reward: integer
```

### story_progress table
```sql
story_progress
├── id: uuid
├── user_id: uuid (references users.id)
├── chapter_id: uuid (references story_chapters.id)
├── current_scene_id: uuid
├── status: text ("in_progress" | "completed")
├── completed_at: timestamptz
└── updated_at: timestamptz
```

### fun_facts table
```sql
fun_facts
├── id: uuid
├── category: text ("history" | "literature" | "culture" | "food" | "nature" | "festivals")
├── content_english: text
├── content_marathi: text
├── content_transliteration: text
├── related_vocabulary: jsonb[]
├── image_url: text (Supabase Storage)
└── source: text
```

### favorite_facts table
```sql
favorite_facts
├── id: uuid
├── user_id: uuid (references users.id)
├── fact_id: uuid (references fun_facts.id)
└── saved_at: timestamptz
```

### fact_of_the_day table
```sql
fact_of_the_day
├── id: uuid
├── date: date (unique)
└── fact_id: uuid (references fun_facts.id)
```

### parent_child_links table
```sql
parent_child_links
├── id: uuid
├── parent_id: uuid (references users.id)
├── child_id: uuid (references users.id)
└── created_at: timestamptz
```

### notification_preferences table
```sql
notification_preferences
├── id: uuid
├── user_id: uuid (references users.id)
├── device_tokens: text[]
├── streak_reminders: boolean
├── daily_challenge_alerts: boolean
├── fact_of_the_day: boolean
├── preferred_time: text
└── timezone: text
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Pronunciation score is always in range **Validates: Requirements 2.3**

*For any* expected Marathi phrase and any transcribed text returned by speech recognition, the computed pronunciation score (using Levenshtein distance normalized by expected length, clamped, multiplied by 100) SHALL always satisfy `0 ≤ score ≤ 100`.

**Validates: Requirements 2.3**

---

### Property 2: Handwriting score is always in range **Validates: Requirements 3.4**

*For any* pair of stroke paths (reference and user-drawn), the DTW-based handwriting accuracy score SHALL always satisfy `0 ≤ score ≤ 100`, regardless of path length, deviation magnitude, or stroke order.

**Validates: Requirements 3.4**

---

### Property 3: XP transactions are always positive and total XP is non-negative **Validates: Requirements 6.1**

*For any* sequence of valid activity completions (lesson, quiz, speaking, writing, reading, daily challenge, streak bonus, fact quiz, mini-game), every individual XP transaction amount SHALL be greater than zero, and the user's `totalXp` SHALL always be non-negative after applying any number of transactions.

**Validates: Requirements 6.1**

---

### Property 4: Streak increments at most once per calendar day **Validates: Requirements 6.7**

*For any* user completing any number of qualifying activities (lesson, quiz, challenge, speaking, writing, reading) within the same calendar day (in the user's local timezone), `currentStreak` SHALL increment by at most 1 for that day, regardless of how many activities are completed.

**Validates: Requirements 6.7**

---

### Property 5: User level is non-decreasing with XP accumulation **Validates: Requirements 6.2**

*For any* sequence of XP award events applied to a user account, the user's `level` SHALL never decrease — it may stay the same or increase, but SHALL never go down as `totalXp` grows.

**Validates: Requirements 6.2**

---

### Property 6: Comprehension score is always in range **Validates: Requirements 4.7**

*For any* set of comprehension question answers (regardless of how many questions, or which answers are correct), the computed comprehension score (`correct / total × 100`) SHALL always satisfy `0 ≤ score ≤ 100`.

**Validates: Requirements 4.7**

---

## Error Handling

### Speech Recognition Failures
- **"Couldn't hear you" (silence/noise)**: Show a friendly retry prompt. Allow up to 3 retries per exercise. After 3 failed attempts, offer a skip option that awards 0 XP for that exercise but allows the learner to continue.
- **API timeout or service unavailable**: On web, retry Web Speech API once; on mobile, switch automatically from Hugging Face Whisper (primary) to Google Cloud STT (fallback). If both fail, attempt Vosk offline on mobile. If all fail, show a user-friendly error and allow skip.
- **Low-confidence transcription** (HF Whisper confidence < threshold): Surface the transcription to the user for confirmation before scoring.

### Network Failures
- **Mid-lesson network loss**: Supabase offline persistence via Expo SQLite automatically saves progress locally. On reconnect, pending writes are replayed in order. The learner sees a subtle offline indicator but can continue the lesson without interruption.
- **API errors (5xx, network timeout)**: Exponential backoff with 3 retries at 1 s, 2 s, 4 s intervals. After exhausting retries, display a user-friendly error message with a manual retry button.
- **Background sync failures**: Failed POST requests (progress saves, XP awards) are queued by the Service Worker and replayed when connectivity returns. XP is not double-awarded because transactions are idempotent by `reference_id`.

### Authentication & Session Errors
- **Expired Supabase JWT**: Supabase client handles silent token refresh automatically. No user action required.
- **Refresh token invalidated**: Redirect user to the login screen with a clear message ("Session expired, please sign in again").
- **Google SSO failure**: Show error message with option to retry.

### Content & Input Validation Errors
- **Invalid or malformed request body**: Joi/Zod schema validation rejects the request at the API boundary and returns a 400 with a descriptive error message. No server-side processing occurs.
- **Request too large** (stroke data or audio upload exceeds 5 MB): Return 413 with a clear message.
- **Unknown lesson or resource ID**: Return 404 with a user-friendly message; client falls back to cached content if available.

### Writing Recognition Failures
- **Canvas drawing too short or no strokes detected**: Prompt the user to draw the character again before submitting.
- **DTW scoring produces an unexpected range**: Score is clamped to [0, 100] before being returned; any internal computation error defaults to a score of 0 and logs the error for monitoring.

### Gamification & XP Errors
- **Duplicate XP award** (retry after network failure): `reference_id` on the XP transaction prevents double-awarding. Idempotency is enforced at the Vercel API route write layer.
- **Badge evaluation failure**: Logged to Sentry; user is not blocked. Badge is re-evaluated on next eligible XP transaction.
- **Leaderboard rank computation failure**: Stale rank is served from cache; re-computation is retried asynchronously.

### Push Notification Failures
- **Invalid OneSignal device token**: Silently remove the token from the user's `notification_preferences.device_tokens`; no notification is sent.
- **OneSignal delivery failure**: Retry delivery up to 3 times. If all retries fail, the notification is dropped; the next scheduled notification is unaffected.

### Monitoring & Alerting
- All unhandled API errors are captured by Sentry free tier with stack trace and user context (anonymized).
- Rate-limit violations (> 100 req/min per user) are logged and the offending token is flagged for review.
- Speech and writing scoring anomalies (scores outside [0, 100] before clamping) trigger a Sentry event for investigation.

---

## Testing Strategy

### Unit Tests

Unit tests cover pure functions and isolated service logic with no live cloud dependencies. Focus areas:

- **Pronunciation scoring function**: Levenshtein distance computation on Devanagari text, normalization, and clamping logic. Test with known phrase pairs and edge cases (empty string, identical strings, completely different strings).
- **Handwriting DTW scorer**: Stroke path comparison, DTW distance computation, stroke order penalty (−20 per misordered stroke), final score clamping to [0, 100].
- **XP calculation formulas**: Each activity XP value, bonus rules, level threshold table, level title mapping.
- **Streak logic**: Increment once per calendar day, timezone-aware comparison, streak freeze consumption and weekly reset, `longestStreak` preservation on reset.
- **Comprehension scorer**: `correct / total × 100` for various answer set sizes and correctness combinations.
- **Input validation schemas** (Joi/Zod): Valid and invalid request bodies for each API endpoint.
- **Media optimization helpers**: Audio normalization, image resizing, Lottie minification utilities.

### Integration Tests

Integration tests verify service wiring and external dependencies using representative examples (1–3 per scenario), with mocked cloud services where possible:

- **Auth flow**: Google OAuth → Supabase Auth user creation → Supabase JWT issuance → protected Vercel API route access.
- **Speech pipeline**: Submit audio → HF Whisper transcription → score computation → XP award → progress save. Test primary path (HF Whisper), fallback to Google Cloud STT, and offline Vosk path.
- **Offline sync**: Simulate network loss mid-lesson → verify local SQLite persistence → simulate reconnect → verify Supabase sync and no double-awards.
- **COPPA compliance**: Register user with age < 13 → verify parental consent flow is triggered and social features are restricted.
- **Notification delivery**: Register device token → trigger scheduled Cloud Function → verify FCM call is made with correct payload.
- **Rate limiting**: Submit > 100 requests/minute on a protected Cloud Function → verify 429 response.
- **Supabase Auth token validation**: Valid JWT → 200; expired or invalid token → 401 from Vercel API route; client-side auto-refresh is handled by Supabase SDK.

### Property-Based Tests

Property-based testing is applied to the pure scoring and gamification logic, using a property-based testing library (e.g., **fast-check** for TypeScript). Each property test runs a minimum of **100 iterations** with randomly generated inputs.

Each test is tagged with the design property it validates:
- Tag format: `Feature: marathi-learning-app, Property {N}: {property_text}`

| Property | Generator | Assertion |
|----------|-----------|-----------|
| **Property 1** — Pronunciation score in range | Random `(expected, transcribed)` Devanagari string pairs | `0 ≤ score(expected, transcribed) ≤ 100` |
| **Property 2** — Handwriting score in range | Random pairs of stroke paths (arrays of `{x, y}` points) | `0 ≤ dtwScore(ref, drawn) ≤ 100` |
| **Property 3** — XP always positive and non-negative total | Random sequences of valid activity types | Each `xpAmount > 0`; `Σ xpAmount ≥ 0` |
| **Property 4** — Streak increments at most once per day | Random activity timestamps on same calendar day | `|newStreak - oldStreak| ≤ 1` per day |
| **Property 5** — Level non-decreasing | Random XP award sequences | `level` after each award `≥` level before |
| **Property 6** — Comprehension score in range | Random `(totalQuestions, correctAnswers)` pairs where `0 ≤ correct ≤ total` | `0 ≤ score ≤ 100` |

### Accessibility & Platform Tests

- Screen reader compatibility (VoiceOver on iOS, TalkBack on Android, NVDA on Web) — manual testing with automated axe-core checks on Web.
- Large text / dynamic font sizes — verify no layout overflow or truncation.
- PWA install prompt and offline behavior — tested in Chrome DevTools offline mode and on physical Android device.
- Native iOS and Android builds — smoke-tested via Expo EAS Build on simulator and physical device.

### Performance Tests

- Lesson load time: automated Lighthouse test asserting < 2 s on simulated 4G connection.
- Animation frame rate: Expo performance monitor asserting 60 fps during Lottie celebrations.
- Offline cache budget: verify Service Worker cache stays within ~200 MB limit after downloading one full level of content.

---

## Key Design Decisions

### 1. Speech Evaluation & Pronunciation Scoring
- **Web PWA (primary)**: Web Speech API (`mr-IN`) runs client-side in the browser — free, zero latency, no server call for transcription
- **Mobile / server-side (primary)**: Hugging Face Inference API with `vasista22/whisper-marathi` (Marathi-fine-tuned Whisper) — free tier, no credit card required
- **Server-side fallback**: Google Cloud Speech-to-Text (`mr-IN`) — 60 min/month free; triggered when HF API times out or returns an error
- **Offline mobile**: Vosk with `vosk-model-small-mr` via `react-native-vosk` — fully on-device, no network required (supports Task 36 offline requirement)
- Scoring algorithm:
  - Transcribe user speech → normalized Marathi text
  - Compare against expected phrase using Levenshtein distance (character-level on Devanagari)
  - Score = (1 - distance/expected_length) × 100, clamped to 0-100
  - Confidence bonus: +10 when HF/Whisper confidence exceeds 0.8
- Retry: if recognition fails (noise, silence), prompt retry with visual guidance; max 3 retries before skip option
- Cost optimization: cache transcriptions by audio hash to avoid duplicate API calls on retry

### 2. Handwriting Recognition & Scoring
- Canvas input: Expo Canvas (React Native) for freehand drawing across web and mobile
- Stroke capture: record touch/mouse points as polyline paths with timestamps
- Recognition approach:
  - Compare user stroke paths against reference stroke_data using Dynamic Time Warping (DTW)
  - Score = similarity percentage (0-100) based on path deviation and stroke order correctness
  - Stroke order matters: penalize out-of-order strokes (−20 per misordered stroke)
- Visual feedback: overlay correct stroke path in green, user's deviation in red
- For word/sentence writing: segment into characters, score each individually, average for overall score
- Library: Custom lightweight DTW implementation for Devanagari character matching

### 3. Reading Comprehension & Fluency
- Read-aloud evaluation: reuse speech recognition pipeline (Web Speech API on web; HF Whisper / Google Cloud STT on mobile) to evaluate user reading displayed text
- Fluency scoring: combine pronunciation accuracy (Levenshtein on transcribed vs. expected) + reading speed (WPM relative to level benchmark)
- Vocabulary-in-context: client-side word tokenization of Devanagari text; tap triggers lookup from Supabase
- Graded readers: content difficulty controlled by average word length, sentence count, and vocabulary frequency
- Comprehension scoring: correct answers / total questions × 100
- Reading speed benchmarks: Beginner < 20 WPM, Intermediate 20-50 WPM, Advanced 50+ WPM

### 4. Offline Support & Real-time Sync
- Expo SQLite for local lesson data storage (phrases, writing characters, reading passages)
- Audio files pre-downloaded per level via background sync
- Writing stroke data and reading passages cached locally
- Progress and XP queued locally, synced when back online (idempotent by `reference_id`)
- Real-time updates via Supabase Realtime subscriptions on `journey_progress` table for live position tracking
- Service Worker for web PWA offline capabilities

### 5. Content Structure
- 3 levels × 10 topics × 10 phrases = ~300 phrases for MVP
- Each lesson flow: intro → phrases → listen & repeat (speaking) → write key words (writing) → read a short passage (reading) → mini-game → quiz
- Writing integrated per lesson: 2-3 key words from the lesson to trace/write
- Reading integrated per lesson: 1 short passage (2-4 sentences) using lesson vocabulary
- Content authored in JSON, stored in Supabase PostgreSQL, cached on client
- Fun facts pool: 100+ facts across 6 categories for MVP
- Facts rotated daily; contextual delivery (e.g., festival facts near Diwali based on date)

### 6. Gamification Engine
- XP formula: lesson completion (50 XP) + quiz score bonus (up to 30 XP) + daily challenge (40 XP) + streak bonus (10 XP/day) + speaking practice (20 XP) + writing practice (20 XP) + reading practice (20 XP) + fact quiz (10 XP)
- Level thresholds: Level 1 (0 XP) → Level 10 (5000 XP), with titles per level
- Titles: Beginner → Explorer → Speaker → Storyteller → Champion → Master → Legend → Guru → Pandit → Marathi Ratna
- Mini-games: word scramble, phrase builder, audio matching, rapid-fire translation, reading speed race, character tracing race
- Animations via Expo Animations + Lottie for celebrations
- Leaderboard: Supabase `leaderboard` table with weekly reset via GitHub Actions cron; computed rank on read
- Badge evaluation: event-driven — on each XP transaction, check badge criteria against user state
- Daily challenges rotate across all three skills: speaking, writing, and reading

### 7. Streak & Freeze Mechanics
- Streak increments if user completes ≥1 activity (lesson/quiz/challenge/speaking/writing/reading) per calendar day (user's timezone)
- Streak freeze: 1 available per week (resets Monday via GitHub Actions cron); auto-applied if user misses a day and freeze is available
- Streak broken: if no activity and no freeze → reset to 0, longest_streak preserved
- Supabase Realtime for fast daily check; persisted to `users` table

### 8. Age-Appropriate Design & Content Moderation
- No social features (chat, custom nicknames on leaderboard) for under-13 users
- Leaderboard displays first name + last initial only (e.g., "Aarav S.")
- Bright, playful UI with illustrated characters
- Parental gate (re-auth) for settings/account changes
- All content pre-moderated (no user-generated content in MVP)

### 9. Notification Delivery
- Push via OneSignal free tier for cross-platform support
- Timing: respect user's `preferred_time` and `timezone` from `notification_preferences` table
- Default schedule: streak reminder at 7 PM local, daily challenge at 8 AM local, fact of the day at 9 AM local
- Quiet hours: no notifications between 9 PM – 7 AM local
- Unsubscribe per category via notification preferences API
- GitHub Actions cron jobs for scheduled notifications

### 10. Error Handling & Retry Strategy
- Speech recognition failure: show "Couldn't hear you" message, allow 3 retries, then offer skip (+0 XP)
- Network failure mid-lesson: Expo SQLite offline persistence auto-saves progress, resume on reconnect
- API errors: exponential backoff (3 retries, 1s/2s/4s), then show user-friendly error with retry button
- Token expiry: Supabase client handles silent JWT refresh automatically; Vercel API routes return 401 for expired or invalid tokens
- Sentry free tier for error tracking and monitoring

### 11. API Security & Middleware
- Supabase Auth JWT verification on all protected Vercel API routes — verify JWT from the `Authorization: Bearer` header using Supabase Admin client; reject with 401 if absent or invalid
- Rate limiting: 100 requests/minute per authenticated user enforced within Vercel API routes
- CORS: configure Vercel Functions CORS middleware to whitelist the web domain and mobile deep link schemes
- Input validation: Zod schemas on all request bodies; reject with 400 if validation fails
- HTTP security headers (CSP, X-Frame-Options, HSTS, X-Content-Type-Options) applied via Vercel `headers` config in `vercel.json`
- Request size limit: 5 MB max enforced in Vercel Functions

### 12. Media Optimization
- Audio format: MP3 (128kbps) for broad compatibility
- Audio files compressed and normalized to consistent volume before uploading to Supabase Storage
- Images: WebP with JPEG fallback; max 800px width for lesson illustrations, 200px for avatars/badges
- Lottie files: minified JSON, lazy-loaded on first animation trigger
- Supabase Storage: aggressive caching headers (Cache-Control: max-age=31536000 for versioned assets), gzip/brotli compression enabled

### 13. PWA Caching Strategy
- App shell (HTML, CSS, JS bundles): cache-first — serve from cache instantly, update in background
- Lesson content (phrases, quiz questions, writing stroke data, reading passages): stale-while-revalidate — serve cached, fetch fresh in background
- Audio files: cache-first with versioned URLs — once cached, never re-fetched unless URL changes
- API responses (progress, XP, leaderboard): network-first — always try fresh data, fall back to cache if offline
- Background sync: queue failed POST requests (progress saves, XP awards) and replay when connectivity returns
- Cache storage limit: ~200MB budget; LRU eviction of oldest level content when exceeded
- Update notification: show "New content available" toast when Service Worker detects updated assets; user taps to refresh

---

## API Endpoints

> All endpoints are implemented as Vercel Serverless Functions under `api/**`. They use the Supabase Admin client for database access and verify the Supabase JWT from the `Authorization: Bearer` header on every protected route.

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/google | Verify Google ID token, create/login user |
| POST | /api/auth/refresh | Refresh access token |
| POST | /api/auth/logout | Invalidate session |
| GET | /api/auth/me | Get current user profile |
| POST | /api/auth/link-child | Parent links to child account |

### Lessons & Content
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/lessons | List lessons by level (paginated) |
| GET | /api/lessons/:id | Get lesson with phrases and quiz |
| POST | /api/speech/evaluate | Evaluate pronunciation, return score |
| GET | /api/writing/characters | List Devanagari characters by type/level |
| GET | /api/writing/lessons | List writing lessons by level |
| GET | /api/writing/lessons/:id | Get writing lesson content with stroke data |
| POST | /api/writing/evaluate | Submit drawn strokes, return accuracy score + XP |
| GET | /api/writing/progress | Get user's writing mastery progress |
| GET | /api/reading/passages | List reading passages by level/type |
| GET | /api/reading/passages/:id | Get passage with vocabulary and comprehension questions |
| POST | /api/reading/read-aloud | Submit read-aloud audio, return fluency score |
| POST | /api/reading/comprehension/submit | Submit comprehension answers, return score + XP |
| GET | /api/reading/progress | Get user's reading progress and speed stats |

### Progress
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/progress | Save lesson progress |
| GET | /api/progress/dashboard | Get user dashboard (stats, streak, next lesson) |

### Journey
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/journey/routes | List available starting cities and routes |
| POST | /api/journey/start | Initialize user journey (select starting city) |
| GET | /api/journey/progress | Get user's current journey position and checkpoint status |
| GET | /api/journey/checkpoints/:id | Get checkpoint detail (lessons, trivia unlocked) |

### Gamification
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/gamification/xp | Get user XP, level, title |
| GET | /api/gamification/badges | Get user badges (earned + available) |
| GET | /api/gamification/daily-challenge | Get today's challenge |
| POST | /api/gamification/daily-challenge/complete | Submit challenge result |
| GET | /api/gamification/leaderboard | Get weekly leaderboard |
| GET | /api/gamification/streak | Get streak status and freeze availability |

### Mini-Games & Story
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/mini-games/:type | Get mini-game data by type |
| POST | /api/mini-games/:type/submit | Submit mini-game result, award XP |
| GET | /api/story/chapters | List story chapters (with lock status) |
| GET | /api/story/chapters/:id/scenes | Get scenes for a chapter |
| POST | /api/story/progress | Save story scene progress |

### Quizzes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/quizzes/lesson/:lessonId | Get quiz questions for a lesson |
| POST | /api/quizzes/submit | Submit quiz answers, return score + XP |

### Fun Facts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/fun-facts/today | Get fact of the day |
| GET | /api/fun-facts/random | Get random fact (contextual) |
| GET | /api/fun-facts/favorites | Get user's saved facts |
| POST | /api/fun-facts/:id/favorite | Toggle favorite |
| POST | /api/fun-facts/quiz | Submit fact quiz answer for bonus XP |

### Profile & Avatar
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/profile/avatar | Get user's avatar and available items |
| PUT | /api/profile/avatar | Update equipped avatar items |
| POST | /api/profile/avatar/unlock | Unlock avatar item (spend XP) |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/notifications/preferences | Get notification preferences |
| PUT | /api/notifications/preferences | Update notification preferences |
| POST | /api/notifications/register-device | Register device token for push |
