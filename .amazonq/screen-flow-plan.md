# Screen Flow Plan

> Last updated: 2025-07-11 (updated)

---

## New User Flow

```
Splash Screen
    ↓
Login Screen (Google OAuth only)
    ↓
Onboarding — Step 1: Age selection (10–13 triggers parent consent flow)
    ↓
Onboarding — Step 2: Gender selection (Boy / Girl / Prefer not to say)
    ↓
Onboarding — Step 3: Native language selection (what language do you speak at home?)
    ↓
Onboarding — Step 4: Why are you learning Marathi? (motivation pick)
    ↓
Onboarding — Step 5: Avatar setup (choose outfit + style, or Skip)
    ↓
Journey Intro — Animated intro: "Your journey across Maharashtra begins in Mumbai"
    ↓
Dashboard (Home) — Level 1 · Mumbai unlocked, today's first lesson ready
```

### Onboarding Step Details

| Step | Screen | Options | Saved to |
|------|--------|---------|----------|
| 1 | Age selection | Number picker or range (10–13, 14–16, 17–20, 20+) | `users.age_range` |
| 2 | Gender selection | Boy / Girl / Prefer not to say | `users.gender` |
| 3 | Native language | Hindi / English / Gujarati / Kannada / Telugu / Tamil / Bengali / Punjabi / Other | `users.native_language` |
| 4 | Learning motivation | For school / Family & heritage / Travel / Curiosity / Other | `users.motivation` |
| 5 | Avatar setup | Outfit + cultural style + hair/expression, or Skip | `users.avatar_config` |

> Under-13 age selection triggers a parent consent screen before proceeding to Step 2.

---

## Existing User Flow

```
Splash Screen
    ↓
Auto-login (Supabase session restored)
    ↓
Dashboard (Home) — resumes exactly where they left off
```

---

## Core App Navigation (after login)

```
Bottom Nav — 4 tabs always visible
├── Home (Dashboard)
│   ├── Greeting + streak/XP header
│   ├── Today's lesson card (current city's next lesson)
│   ├── Daily challenge banner (based on completed lessons)
│   └── Continue Journey card (compact map preview)
│
├── Lessons
│   ├── Level tabs: Beginner / Intermediate / Advanced
│   ├── Skill grid: Reading / Writing / Speaking / Games
│   └── Unit list → Lesson detail → Practice screen
│       ├── Reading Practice
│       ├── Writing Practice (tracing canvas)
│       └── Speaking Practice (mic + waveform)
│
├── Journey (Map)
│   ├── Maharashtra map — 12 cities as levels
│   ├── Tap city → City Detail bottom sheet
│   └── Level Complete → transition animation → next city unlocked
│
└── Profile
    ├── Avatar customization
    ├── Badges earned
    ├── Streak + XP + level stats
    ├── Streak freeze
    └── Settings / Parent dashboard link
```

---

## Key Transition Screens

Not part of the bottom nav — triggered by in-app events.

| Trigger | Screen |
|---------|--------|
| Finish a lesson | Lesson Complete card (+XP, streak update) |
| Finish all lessons + challenges in a city | Level Complete screen (confetti, avatar moves on map) |
| New city unlocked | City Unlocked announcement (brief, then goes to Journey tab) |
| First time opening Journey tab | Journey Intro animation (one-time only) |
| Daily challenge completed | Challenge Complete card (+XP) |
| Badge earned | Badge Unlock overlay |
| Streak milestone (7, 30, 100 days) | Streak Celebration overlay |

---

## Parent Dashboard Flow

Accessible from Profile → Parent Dashboard (under-13 users only).

```
Profile → Parent Dashboard link
    ↓
Parent re-authentication
    ↓
Parent Dashboard
    ├── Child's progress per city
    ├── Time spent per week
    ├── COPPA / UK GDPR controls (restrict leaderboard, social features)
    └── Unlink child account
```

---

## Decisions Log

| # | Question | Decision |
|---|----------|----------|
| 1 | Native language list — fixed or searchable? | **Fixed set** at launch: Hindi, English, Gujarati, Kannada, Telugu, Tamil, Bengali, Punjabi, Other. Can expand later |
| 2 | Does gender affect anything in the app? | **Yes** — affects avatar defaults on setup screen and pronouns used in UI copy |
| 3 | Guest mode? | **Removed** — login required for all users |
| 4 | Journey Intro style? | **Deferred** — decide later |
| 5 | Does motivation affect lesson recommendations? | **No** — analytics only |

---

## Open Questions / To Discuss

- [ ] Journey Intro — full animated sequence or a simple illustrated card with a "Start Journey" CTA?
- [ ] Pronouns in UI copy — which strings are gender-aware? (e.g. greeting, lesson complete card, badges)
- [ ] Under-13 parent consent flow — what exactly does the parent see and approve before child proceeds?
