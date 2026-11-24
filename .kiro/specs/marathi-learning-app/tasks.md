# Implementation Plan: Marathi Language Learning App

## Overview

39 tasks across 13 phases delivering a gamified, cross-platform Marathi learning app. Phases 1–6 produce the MVP (auth, journey map, lessons, speaking, writing, reading). Phases 7–13 add gamification, story mode, cultural trivia, notifications, offline support, and production deployment.

Each task is self-contained and completable in 1–3 days. Tasks within a phase should be completed in order unless the dependency graph indicates otherwise.

## Task Dependency Graph

```json
{
  "waves": [
    {
      "wave": 1,
      "tasks": [1, 2],
      "description": "Project scaffold and Firebase project setup"
    },
    {
      "wave": 2,
      "tasks": [3, 4, 5],
      "description": "Auth, Firestore security rules, Whisper infrastructure — all depend on wave 1"
    },
    {
      "wave": 3,
      "tasks": [6, 7, 8, 9, 10],
      "description": "Journey map data+API, onboarding, progression mechanics, lesson data — depend on wave 2"
    },
    {
      "wave": 4,
      "tasks": [11, 12, 13],
      "description": "Lesson content, lesson list UI, lesson flow UI — depend on wave 3"
    },
    {
      "wave": 5,
      "tasks": [14, 15, 16, 17, 18],
      "description": "Speaking Cloud Function, writing data+API, handwriting Cloud Function, reading data+API — depend on wave 4"
    },
    {
      "wave": 6,
      "tasks": [19, 20],
      "description": "Speaking UI, writing UI — depend on wave 5"
    },
    {
      "wave": 7,
      "tasks": [21],
      "description": "Reading UI — depends on wave 5"
    },
    {
      "wave": 8,
      "tasks": [22, 23, 24, 25, 26, 27, 28],
      "description": "Gamification engine (XP, streak, badges, quizzes, mini-games, daily challenges, leaderboard) — depend on waves 6-7"
    },
    {
      "wave": 9,
      "tasks": [29, 30, 31, 32, 33, 34],
      "description": "Avatar, story mode data+API, story mode UI, cultural trivia data, cultural trivia UI, progress dashboard — depend on wave 8"
    },
    {
      "wave": 10,
      "tasks": [35, 36, 37],
      "description": "Parent dashboard, notifications, offline persistence — depend on wave 9"
    },
    {
      "wave": 11,
      "tasks": [38, 39],
      "description": "UI polish and theming, testing and deployment — depend on all prior waves"
    }
  ]
}
```

## Tasks

### Phase 1: Project Setup & Foundation

- [x] 1. Initialize Expo project structure
  - Set up Expo project with React Native for cross-platform (Web + iOS + Android)
  - Configure TypeScript, ESLint, Prettier
  - Set up Expo Application Services (EAS) for build and deployment
  - Configure Expo Router for file-based navigation
  - Add shared types and utilities package
  - Set up development environment (iOS Simulator, Android Emulator, Web browser)

- [x] 2. Set up Supabase project and configuration
  - Create Supabase project (free tier, no CC required)
  - Enable Supabase Auth with Google OAuth provider
  - Create all PostgreSQL tables per data models in design.md
  - Enable Supabase Realtime on `journey_progress` table for live XP sync
  - Create Supabase Storage buckets: `audio`, `images`, `avatars`
  - Set up Row Level Security (RLS) policies on all tables
  - Configure Supabase SDK in Expo app and web package
  - Set up Supabase local development environment for testing
  - Remove all Firebase paid service dependencies (Functions, Storage, Hosting, App Hosting)

- [x] 3. Implement authentication with Supabase Auth and Google SSO
  - Integrate Supabase Auth SDK in Expo app
  - Implement Sign in with Google button using Supabase OAuth flow
  - Handle Google OAuth flow and Supabase session management
  - Implement age verification prompt after first sign-in
  - Insert user row into `users` table on first login using data model from design.md
  - Set `under_13` boolean column (replaces Firebase custom claims for COPPA)
  - Initialize user gamification data (XP, streak, avatar defaults)
  - Implement parental consent flow for under-13 users
  - Implement parent-child account linking via Vercel API route
  - Set up Supabase Auth session persistence across app restarts
  - Create auth context and hooks for React components

- [x] 4. Author Supabase Row Level Security (RLS) policies
  - Write RLS policies for `users` table: owner read/write only
  - Write RLS policies for public read-only tables: `lessons`, `phrases`, `writing_characters`, `reading_passages`, `fun_facts`, `badges`, `avatar_items`, `mini_games`, `story_chapters`, `journey_routes`, `daily_challenges`, `fact_of_the_day`
  - Write RLS policies for user data tables (`lesson_progress`, `xp_transactions`, `user_badges`, etc.): owner read/write only
  - Write RLS policy for `leaderboard`: public read, no client write
  - Restrict under-13 leaderboard display via `under_13` column check in Vercel API route
  - Deploy and verify RLS policies against Supabase local dev environment
  - Deploy policies to production Supabase project

- [x] 5. Set up speech recognition infrastructure
  - Add Hugging Face Inference API client to Vercel API dependencies (no SDK needed, plain fetch)
  - Store `HF_API_TOKEN` in Vercel environment config (not in source code)
  - Configure Google Cloud Speech-to-Text as server-side fallback with credentials stored in env
  - Add `react-native-vosk` to mobile app dependencies with `vosk-model-small-mr` bundled for offline support
  - Set up API rate limiting and cost controls on the Hugging Face account dashboard
  - Implement transcription caching by audio hash in Supabase to avoid duplicate API calls on retry
  - Create error handling utilities for API timeouts and service unavailability

---

### Phase 2: Gamified User Journey (Map-Based Progression)

- [x] 6. Build journey map data structure and Vercel API routes
  - Seed `journey_routes` table in Supabase with Maharashtra cities and checkpoint data
  - Define 5 starting cities (Mumbai, Nagpur, Aurangabad, Nashik, Kolhapur) with checkpoint coordinates to Pune
  - Create checkpoints as jsonb with requiredXp, position {x,y}, unlocks (lessonIds, triviaId), name, and marathiName
  - Create `journey_progress` table rows per user/route using the data model from design.md
  - Implement Vercel API route GET /api/journey/routes — list available starting cities and routes
  - Implement Vercel API route POST /api/journey/start — insert journey_progress row
  - Implement Vercel API route GET /api/journey/progress — return current position and checkpoint statuses
  - Implement Vercel API route GET /api/journey/checkpoints/:id — return checkpoint detail with unlocked lessons and trivia

- [x] 7. Implement journey map UI component
  - Build interactive map component using SVG or Canvas
  - Display user avatar at current position on the route
  - Render route path with checkpoint markers in three visual states: locked (grayed), current (pulsing highlight), completed (checkmark)
  - Implement animated avatar movement along route when position updates
  - Display progress percentage and XP required to reach next checkpoint
  - Create milestone celebration animation (confetti, sound effect) on checkpoint unlock
  - Add tap interaction on checkpoints to open detail view (checkpoint name in Marathi and English, unlocked lessons, associated trivia)

- [x] 8. Build onboarding flow with city selection
  - Create city selection screen listing Maharashtra starting cities with cultural highlights
  - Display city information cards showing name in Marathi and English and distance to Pune
  - Implement city selection confirmation screen with route preview
  - Initialize users/{userId}/journeyProgress document via POST /api/journey/start on confirmation
  - Create welcome animation and journey introduction narrative screen
  - Redirect to journey map with avatar placed at starting city

- [x] 9. Implement real-time journey progression mechanics
  - Implement XP-to-map-position conversion: accumulated XP / total route XP, mapped to route coordinate
  - Set up Supabase Realtime subscription on `journey_progress` table — recalculate and update avatar position on every XP change without page reload (per Req 11.7)
  - Implement checkpoint unlock detection: when XP crosses a checkpoint's requiredXp threshold, trigger unlock flow
  - Deliver milestone rewards on unlock: award associated badge, unlock lesson IDs, surface cultural trivia card
  - Detect journey completion when all checkpoints are passed and display celebration screen
  - Award Pune Explorer badge on journey completion and offer option to start new journey from a different city (per Req 11.8)

---

### Phase 3: Core Lesson Engine

- [x] 10. Build lesson data structure and Vercel API routes
  - Seed `lessons` table in Supabase using the data model from design.md (including xp_reward, reading_passage_id, mini_game_id, writing_character_ids)
  - Seed `phrases` table for each lesson
  - Seed `quiz_questions` table per lesson
  - Implement lesson ordering via order_index and level filtering
  - Create `lesson_progress` table rows for completion tracking
  - Implement Vercel API route GET /api/lessons — list lessons by level with pagination
  - Implement Vercel API route GET /api/lessons/:id — get lesson with phrases and quiz questions

- [ ] 11. Create lesson content (MVP dataset)
  - Author 30 lessons across 10 topics times 3 levels
  - Record native speaker audio pronunciations for approximately 300 phrases
  - Compress audio to MP3 at 128 kbps and upload to Supabase Storage `audio` bucket
  - Optimize images to WebP with max 800 px width and upload to Supabase Storage `images` bucket
  - Store Supabase Storage public URLs in table fields
  - Create 3 to 5 quiz questions per lesson across all four types
  - Create 2 to 3 writing exercises per lesson with stroke data
  - Create 1 reading passage per lesson (2 to 4 sentences) with vocabulary tags

- [x] 12. Build lesson list and detail screens
  - Create lesson list screen with level tabs (Beginner, Intermediate, Advanced)
  - Implement lesson search and topic filter
  - Build lesson detail screen with phrase cards showing Devanagari text, transliteration, and English meaning
  - Add audio playback button per phrase
  - Show lesson completion status and score from users/{userId}/progress
  - Implement lesson unlock gating based on journey checkpoint data

- [x] 13. Build lesson flow UI
  - Create lesson introduction screen showing objectives and estimated duration
  - Build phrase learning screen with audio playback per phrase
  - Implement speaking practice screen shell wired to Task 19 Cloud Function
  - Create writing practice screen shell with canvas wired to Task 17 Cloud Function
  - Build reading practice screen shell with tap-to-define wired to Task 21 UI
  - Integrate mini-game launch point
  - Create quiz screen supporting all four question types
  - Implement lesson completion screen with XP award animation, badge check, and next lesson CTA

---

### Phase 4: Speaking Practice

- [x] 14. Implement speech recognition Vercel API route
  - Implement Vercel API route POST /api/speech/evaluate: on web, accept transcript from client-side Web Speech API; on mobile, accept audio upload and call Hugging Face `vasista22/whisper-marathi` as primary, fall back to Google Cloud STT on timeout or error
  - Implement pronunciation scoring using Levenshtein distance on Devanagari text, normalized by expected phrase length, clamped to range 0 to 100
  - Add confidence score bonus of +10 when HF Whisper confidence exceeds 0.8
  - Enforce 3-attempt limit per exercise: after 3 recognition failures, return canSkip: true and xpAward: 0
  - Implement idempotent XP award using reference_id to prevent double-awards on client retry
  - Return low-confidence transcription to client for user confirmation before final scoring

- [x] 15. Build speaking practice UI
  - Create Listen and Repeat exercise screen
  - Implement audio recording with real-time waveform visualization
  - Add record button with clear recording-in-progress visual state
  - Display score 0 to 100 with descriptive label after each attempt
  - Implement retry, voluntary skip, and next controls; show forced skip option after 3 recognition failures
  - Add haptic and sound feedback for correct and incorrect results
  - Create pronunciation guidance panel showing phonetic tips
  - Track and display speaking progress (average score, total exercises completed)

---

### Phase 5: Writing Practice (Devanagari)

- [x] 16. Build writing content and data structure
  - Author Devanagari character set: 13 vowels, 36 consonants, 20 or more common conjuncts
  - Create strokeData (ordered stroke paths as arrays of {x, y} points) for each character
  - Organize into writing lessons by level
  - Seed `writing_characters` and `writing_lessons` tables in Supabase
  - Create `writing_progress` table rows per user
  - Link writing character IDs to lesson rows via writing_character_ids column
  - Implement Vercel API routes GET /api/writing/characters and GET /api/writing/lessons/:id

- [x] 17. Implement handwriting recognition Vercel API route
  - Implement Vercel API route POST /api/writing/evaluate: accept user stroke paths, compare against reference stroke_data using Dynamic Time Warping (DTW)
  - Implement DTW algorithm for polyline path similarity scoring at character level
  - Apply stroke order penalty of -20 per misordered stroke
  - Clamp final score to range 0 to 100
  - For word and sentence writing: segment into characters, score each individually, return average as overall score
  - Return per-character accuracy breakdown for client overlay rendering
  - Award XP: 10 XP per character mastered, 20 XP per word, 30 XP per sentence

- [x] 18. Build writing practice UI
  - Create character lesson screen with animated stroke order demonstration
  - Build drawing canvas with undo, clear, and submit controls using Expo Canvas
  - Render user strokes in real time; on submission overlay correct path in green and deviation in red
  - Create score display with retry option after each attempt
  - Build spelling exercise screen: play audio, user writes word in Devanagari
  - Implement dictation mode: play phrase audio, user writes full sentence
  - Create writing progress screen showing characters mastered count and accuracy history
  - Mark character as mastered after 3 consecutive scores of 80 or above

---

### Phase 6: Reading Practice

- [x] 19. Build reading content and data structure
  - Author 10 graded reading passages per level (30 total)
  - Tag vocabulary words per passage with meaning, transliteration, and audio URL
  - Create 3 to 5 comprehension questions per passage
  - Seed `reading_passages`, `reading_vocab`, and `reading_questions` tables in Supabase
  - Create `reading_progress` table rows per user
  - Link passage IDs to lesson rows via reading_passage_id column
  - Implement Vercel API routes GET /api/reading/passages and GET /api/reading/passages/:id
  - Implement Vercel API routes POST /api/reading/read-aloud and POST /api/reading/comprehension/submit

- [x] 20. Build reading practice UI
  - Create passage list screen organized by level and passage type
  - Build reading screen displaying Marathi text in Devanagari with optional transliteration toggle
  - Implement tap-to-define on any word: show popup with meaning, transliteration, and audio playback
  - Create read-aloud mode with word-by-word highlight synchronized to user recording
  - Implement recording button and fluency score display combining pronunciation accuracy and WPM
  - Add reading speed measurement: calculate WPM from word count divided by elapsed seconds
  - Build comprehension quiz screen shown after passage completion
  - Create reading progress dashboard showing passages completed, average WPM, and comprehension scores
  - Award XP: 30 XP per passage completion, 20 XP comprehension bonus, 20 XP read-aloud bonus

---

### Phase 7: Gamification Engine

- [x] 21. Build XP and leveling system
  - Implement Vercel API route for XP award accepting userId, source, xpAmount, and referenceId; write to `xp_transactions` table and update `users.total_xp` and `users.level` atomically
  - Reject duplicate awards by checking reference_id uniqueness before writing
  - Implement level threshold table for 10 levels from 0 to 20000 XP with title assignment
  - Update `journey_progress.total_xp_earned` after each award to trigger Supabase Realtime live client sync
  - Implement real-time XP gain animation on client (floating +N XP label)
  - Create XP history screen showing transaction log with source, amount, and timestamp

- [x] 22. Build streak system
  - Implement streak increment Vercel API route: increment current_streak if last activity was yesterday in user timezone; no-op if already incremented today; reset to 1 if gap is greater than 1 day subject to freeze check
  - Implement streak freeze: 1 available per week resetting Monday via GitHub Actions cron; auto-apply freeze if user misses exactly 1 day and freeze is available
  - Preserve longest_streak on reset
  - Supabase Realtime subscription on `users` table for fast client streak reads
  - Create streak calendar UI component showing 30-day activity grid
  - Add streak freeze availability indicator and last-used date display

- [x] 23. Build badges and achievements
  - Define badge criteria rows in `badges` table using typed rules (xp_threshold, streak_count, lessons_completed, speaking_score, writing_mastery)
  - Implement event-driven badge evaluation in Vercel API route triggered on each XP award: check all unearned badge criteria against current user state
  - Write earned badge to `user_badges` table with earned_at timestamp
  - Award badge xp_reward via the XP Vercel API route
  - Create badge showcase UI: earned badges in full color, locked badges grayed with progress indicator
  - Implement badge unlock animation and in-app notification

- [x] 24. Build quizzes
  - Implement Vercel API routes GET /api/quizzes/lesson/:lessonId and POST /api/quizzes/submit
  - Support all four question types: multiple_choice, fill_blank, match_pair, speak_answer
  - Implement timed mode with countdown timer display and bonus XP for answering within time limit
  - Build quiz UI with question card, answer options, and timer
  - Implement quiz results screen showing correct answers, explanation, and XP earned
  - Add per-lesson quiz completion tracking and first-attempt XP cap on retry

- [x] 25. Build mini-games
  - Implement Vercel API routes GET /api/mini-games/:type and POST /api/mini-games/:type/submit
  - Build word scramble, phrase builder, audio matching, rapid-fire translation, reading speed race, and character tracing race games
  - Create shared game UI shell with timer display, score counter, and XP award on completion

- [x] 26. Build daily challenges
  - Implement GitHub Actions cron job running daily at midnight IST to generate a new `daily_challenges` row rotating across speaking, writing, and reading types
  - Implement Vercel API routes GET /api/gamification/daily-challenge and POST /api/gamification/daily-challenge/complete
  - Create daily challenge card on dashboard home screen
  - Implement challenge completion tracking: award 40 XP base and 20 XP perfect score bonus
  - Trigger OneSignal push notification when new daily challenge is generated

- [x] 27. Build leaderboard
  - Implement GitHub Actions cron job running every Monday at midnight IST to aggregate weekly XP per user and write to `leaderboard` table with computed rank
  - Implement Vercel API route GET /api/gamification/leaderboard returning paginated weekly leaderboard
  - Apply privacy rule in Vercel API route: for users with under_13=true return display_name as first name and last initial only; never expose full name or profile photo (per Req 9.5)
  - Build leaderboard UI with rank, avatar, display name, and weekly XP; highlight current user row
  - Leaderboard participation is opt-in via settings toggle (per Req 6.8)

- [x] 28. Build avatar customization
  - Seed `avatar_items` table in Supabase with categories: hair, outfit, accessory, background; each item has xp_cost and level_required
  - Implement Vercel API routes GET /api/profile/avatar, PUT /api/profile/avatar, POST /api/profile/avatar/unlock
  - Build avatar editor UI with category tabs, item grid, and preview
  - Implement XP-spend unlock flow: deduct xp_cost and add itemId to users.unlocked_items
  - Display equipped avatar on leaderboard entries, dashboard header, and journey map

---

### Phase 8: Story Mode

- [x] 29. Build story mode data structure and Vercel API routes
  - Seed `story_chapters` table in Supabase with required_level gate
  - Seed `story_scenes` table with scene_type, dialogue_options, reading_content, writing_prompt, and xp_reward
  - Author 3 story chapters for MVP: market, school, and festival scenarios
  - Upload character illustration and background scene assets to Supabase Storage `images` bucket
  - Implement Vercel API routes GET /api/story/chapters, GET /api/story/chapters/:id/scenes, POST /api/story/progress
  - Store progress in `story_progress` table keyed by user_id and chapter_id

- [x] 30. Build story mode UI
  - Create chapter selection screen with locked and unlocked states based on requiredLevel
  - Build scene screen displaying narrative text, character illustration, and scene background
  - Implement dialogue choice system: show options with Marathi text, transliteration, and audio; evaluate choice; branch to correct nextSceneId
  - Build reading scenes: display Marathi sign or letter content, comprehension question, tap-to-define vocabulary
  - Implement writing scenes: show writing prompt, embed drawing canvas, evaluate via POST /api/writing/evaluate
  - Handle mixed scenes combining dialogue, reading, and writing in sequence
  - Create scene completion transition with XP award display
  - Implement chapter completion screen showing outcome title, statistics, and any badge awarded

---

### Phase 9: Cultural Trivia System

- [x] 31. Build fun facts content and data structure
  - Author 100 or more fun facts across 6 categories
  - Include 2 to 3 related Marathi vocabulary items with audio per fact
  - Seed `fun_facts` table in Supabase
  - Create `favorite_facts` table for user favorites
  - Implement fact-of-the-day rotation via GitHub Actions cron: select one fact per day with no repeats within 30 days; write to `fact_of_the_day` table
  - Implement Vercel API routes GET /api/fun-facts/today, GET /api/fun-facts/random, GET /api/fun-facts/favorites, POST /api/fun-facts/:id/favorite, POST /api/fun-facts/quiz

- [x] 32. Build fun facts UI
  - Create Did You Know card component showing Devanagari text, transliteration, English content, image, and vocabulary chips with audio
  - Surface fact card between lessons and after quiz completion
  - Add heart button to toggle favorite with immediate optimistic UI update synced to Firestore
  - Create favorites collection screen with category filter and text search
  - Build fact-of-the-day widget on dashboard home screen
  - Implement fact mini-quiz screen: multiple choice on previously viewed facts; award bonus XP on correct answer
  - Link contextually relevant facts to journey checkpoints so they surface on checkpoint unlock

---

### Phase 10: Progress Dashboard and Parent Features

- [x] 33. Build progress dashboard UI
  - Create overview screen: lessons completed, total XP, current level and title, current streak, longest streak
  - Implement skill breakdown cards: speaking average accuracy, writing characters mastered, reading average WPM and comprehension score
  - Build 30-day streak calendar visualization grid
  - Create badge showcase grid: earned badges in full color, locked badges grayed with progress bar
  - Add Continue Learning CTA pointing to next recommended lesson
  - Add fun facts collection summary with link to full collection screen
  - Create weekly XP chart split by skill category (speaking, writing, reading, gamification)
  - Embed journey map position summary showing current checkpoint and progress percentage

- [x] 34. Build parent dashboard and COPPA controls
  - Build parent view of linked child progress: time spent per day, lessons completed, current streak, XP, current level
  - Display child skill breakdown cards matching the learner dashboard layout
  - Implement parental re-authentication gate: require Google credential re-entry before accessing account settings, linked accounts, or notification preferences for under-13 users (per Req 9.6)
  - Implement parent-child account unlink flow with confirmation step (per Req 9.7)
  - Enforce under-13 social restrictions at UI level: hide leaderboard participation toggle and custom display name field
  - Add weekly activity report screen exportable as a shareable summary

---

### Phase 11: Notifications

- [x] 35. Set up OneSignal and notification system
  - Configure OneSignal free tier in Expo app using expo-notifications
  - Implement device token registration: store token in `notification_preferences.device_tokens` on app launch
  - Handle stale token cleanup: remove token when OneSignal delivery returns an invalid token error
  - Create notification preferences management screen with per-category toggles
  - Implement Vercel API routes POST /api/notifications/register-device and GET/PUT /api/notifications/preferences
  - Set up three GitHub Actions cron jobs: streak reminder at 7 PM local, daily challenge alert at 8 AM local, fact of the day at 9 AM local
  - Enforce quiet hours 9 PM to 7 AM local by checking preferred_time and timezone before dispatching
  - Implement per-category opt-out respected on every dispatch

---

### Phase 12: Offline Support and Polish

- [x] 36. Implement offline persistence and background sync
  - Implement Expo SQLite cache for lesson content (phrases, writing stroke data, reading passages): populate on first lesson open, serve from cache when offline
  - Queue failed progress saves and XP awards via Service Worker background sync on web and Expo TaskManager on mobile; replay on reconnect
  - Enforce XP idempotency on replay using reference_id to prevent double-awards
  - Pre-download audio files for current level to local cache via background task
  - Add offline mode detection banner and subtle sync-pending status indicator
  - Verify PWA Service Worker caching strategy matches design.md Decision 13

- [x] 37. UI polish and theming
  - Create design system: color tokens, typography scale including Noto Sans Devanagari for Marathi text, spacing tokens
  - Design illustrated character and mascot and apply consistently across onboarding, lessons, and celebration screens
  - Implement animated transitions using Expo Animations and Lottie: lesson completion, level-up, badge unlock, checkpoint reach
  - Build responsive layout that works on mobile, tablet, and desktop web widths
  - Add dark mode support via system preference detection
  - Implement haptic feedback using expo-haptics on correct answers, incorrect answers, and milestone events
  - Audit accessibility: add accessibilityLabel and accessibilityHint to all interactive elements, verify minimum 44 by 44 pt touch targets, confirm WCAG AA color contrast throughout
  - Add sound effects for correct answers, incorrect answers, level-up, and badge unlock
  - Implement loading skeleton screens for all data-fetching screens

---

### Phase 13: Testing and Deployment

- [x] 38. Testing
  - Unit tests for Cloud Functions using Jest:
    - Pronunciation scoring: Levenshtein distance, normalization, and clamping with known phrase pairs and edge cases (empty string, identical strings, completely different strings)
    - DTW handwriting scorer: path comparison, stroke order penalty application, and score clamping to 0-100
    - XP calculation: per-source values, bonus rules, level threshold table, and title mapping
    - Streak logic: timezone-aware increment, freeze consumption, Monday reset, longestStreak preservation on reset
    - Comprehension scorer: correct divided by total times 100 for various answer set sizes and correctness combinations
    - Zod input validation schemas: valid and invalid request bodies for each Cloud Function endpoint
  - Property-based tests using fast-check with minimum 100 iterations each:
    - Property 1: 0 <= pronunciationScore(expected, transcribed) <= 100 for any Devanagari string pair
    - Property 2: 0 <= dtwScore(refStrokes, userStrokes) <= 100 for any stroke path pairs
    - Property 3: each xpAmount > 0 and totalXp never decreases for any valid activity sequence
    - Property 4: absolute difference between newStreak and oldStreak is at most 1 per calendar day for any activity timestamp set
    - Property 5: user level after XP award is greater than or equal to level before for any XP sequence
    - Property 6: 0 <= comprehensionScore(correct, total) <= 100 where 0 <= correct <= total
  - Integration tests against Firebase emulator suite:
    - Auth flow: Google token verification to Firebase user creation to protected Cloud Function access
    - Speech pipeline: audio upload to Whisper transcription to score computation to XP award to progress save; test both primary path and Google Cloud STT fallback
    - Offline sync: simulate network loss mid-lesson, verify local SQLite persistence, simulate reconnect, verify Firestore sync with no double XP awards
    - COPPA compliance: register user with age under 13 and verify parental consent flow triggers and social features are restricted in response payloads
    - Notification delivery: register device token, trigger scheduled Cloud Function, verify correct FCM payload is dispatched
    - Rate limiting: submit more than 100 requests per minute to a protected Cloud Function and verify 429 response
    - Firebase Auth token validation: valid ID token returns 200; expired or invalid token returns 401 from Cloud Function
  - E2E tests using Detox for mobile and Playwright for web:
    - Full lesson flow: speaking exercise to writing exercise to reading exercise to quiz to XP gain animation to level-up screen
    - Story mode: chapter selection to dialogue scene to read_sign scene to write_note scene to chapter completion
    - Mini-game completion: reading speed race and character tracing race through to XP award
    - Journey checkpoint unlock: earn threshold XP, verify avatar position update on map, verify checkpoint celebration screen
  - Performance tests: Lighthouse asserting lesson load under 2 seconds on simulated 4G; Expo performance monitor asserting 60 fps during Lottie celebration animations
  - Accessibility audit: axe-core automated scan on web build; manual VoiceOver walkthrough on iOS and TalkBack walkthrough on Android through core lesson flow
  - Security tests: Firebase security rules test suite covering all collection access patterns including under-13 leaderboard write restriction

- [x] 39. Deploy MVP
  - Configure production Supabase project separate from development with its own environment variables
  - Deploy Supabase RLS policies and PostgreSQL indexes to production
  - Deploy all Vercel Serverless Functions to production
  - Configure Vercel hosting: PWA manifest, vercel.json rewrite rules mapping /api/** to Vercel Functions, HTTP security headers in headers config
  - Set up CI/CD pipeline in GitHub Actions: lint to type-check to unit tests to property-based tests to build to deploy to Vercel on merge to main
  - Configure Expo EAS Build profiles for development, preview, and production
  - Submit iOS build to TestFlight for internal testing then App Store review
  - Submit Android build to Google Play internal track then production
  - Enable Sentry free tier for error tracking in production app build
  - Set up uptime monitoring via Vercel Analytics
  - Implement app store optimization: localized keywords, device-specific screenshots, and app descriptions for both stores
  - Remove all Firebase paid service config (firebase.json, .firebaserc, firestore.rules, storage.rules, database.rules)

## Notes

- Tasks 4 and 5 can be worked in parallel with Tasks 6 through 9 once Task 2 is complete.
- Content authoring tasks (11, 16, 31) can be parallelized with engineering tasks in the same phase. Content is a dependency for UI tasks but not for Cloud Function tasks.
- The speech Cloud Function (Task 14) is a shared dependency for speaking practice (Task 15), read-aloud in reading (Task 20), and story mode speaking scenes (Task 30). Complete Task 14 before those tasks.
- Run Firebase emulators locally for all Cloud Function development to avoid consuming production Firebase quotas.
- All XP award calls must pass a referenceId (lessonId, challengeId, sceneId, etc.) to ensure idempotency on retry. This is enforced in the XP Cloud Function (Task 21).
- Firestore security rules (Task 4) must be kept in sync as new collections are added in later phases. Revisit after each phase that introduces a new collection.
- Tasks 36 and 37 can be started as soon as the features they polish are complete; they do not need to wait for all prior phases to finish.

---

### Phase 14: Mobile App Screen Completion

- [x] 40. Fix LessonDetailScreen routing and add missing mobile route files
  - Fix `LessonDetailScreen.tsx` to use expo-router hooks instead of React Navigation props
  - Create `practice.tsx` top-level route (speaking/writing/reading hub)
  - Create `profile.tsx` top-level route (avatar, progress, settings, sign out)
  - Register `practice` and `profile` in `_layout.tsx`

- [x] 41. Create mobile Reading practice screen
  - Port web ReadingPage.tsx logic to React Native
  - Passage list with level tabs, tap-to-define vocab popup, comprehension quiz
  - Create `reading.tsx` route and register in `_layout.tsx`

- [x] 42. Create mobile Story Mode screen
  - Port web StoryPage.tsx logic to React Native
  - Chapter list, dialogue scenes, read_sign scenes, write_note scenes with SVG canvas
  - Create `story.tsx` route and register in `_layout.tsx`

- [x] 43. Create mobile Progress Dashboard screen
  - Port web ProgressPage.tsx logic to React Native
  - XP/level/streak overview, skill breakdown, 30-day calendar grid, badge grid
  - Create `progress.tsx` route and register in `_layout.tsx`

- [x] 44. Create mobile Avatar customization screen
  - Port web AvatarPage.tsx logic to React Native
  - Category tabs, item grid, XP-spend unlock, equipped preview
  - Create `avatar.tsx` route and register in `_layout.tsx`

- [x] 45. Create mobile Notifications preferences screen
  - Port web NotificationPreferencesPage.tsx logic to React Native
  - Per-category toggles, quiet hours, device token registration
  - Create `notifications.tsx` route and register in `_layout.tsx`

- [x] 46. Create mobile Parent Dashboard screen
  - Port web ParentDashboardPage.tsx logic to React Native
  - Child progress view, re-auth gate, unlink flow
  - Create `parent.tsx` route and register in `_layout.tsx`

- [x] 47. Create mobile Fun Facts screen
  - Port web FunFactsPage.tsx logic to React Native
  - Fact card, favorites, fact-of-the-day, mini-quiz
  - Create `fun-facts.tsx` route and register in `_layout.tsx`

- [x] 48. Create mobile Leaderboard and Daily Challenge screens
  - Leaderboard with rank/avatar/XP, current user highlight, privacy for under-13
  - Daily challenge card with completion flow and XP award
  - Create `leaderboard.tsx` and `challenge.tsx` routes and register in `_layout.tsx`
