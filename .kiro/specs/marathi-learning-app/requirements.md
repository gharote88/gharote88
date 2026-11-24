# Requirements Document

## Introduction

A web and mobile application that teaches spoken, written, and read Marathi to children and young adults aged 10–20 years. The app delivers structured, interactive lessons organized by difficulty level, covering conversational topics grounded in everyday life. It combines speech recognition for pronunciation practice, Devanagari writing exercises with handwriting recognition, and reading comprehension passages. A deep gamification layer — XP, levels, streaks, leaderboards, collectible badges, a gamified journey map, and a story mode — keeps learners engaged and returning daily. Cultural enrichment is woven in through "Fun Facts" about Maharashtra and Marathi literature. Authentication uses Google SSO via Supabase Auth, with parental oversight controls and COPPA/UK GDPR compliance for users under 13. The app is distributed as a PWA and native mobile apps (iOS and Android), backed by Supabase PostgreSQL, Supabase Realtime, and Vercel Serverless Functions. All infrastructure is free-tier with no credit card required.

---

## Glossary

- **Devanagari**: The script used to write Marathi (and several other South Asian languages). Characters include vowels (स्वर), consonants (व्यंजन), and conjuncts (जोडाक्षरे).
- **Marathi**: An Indo-Aryan language spoken primarily in the state of Maharashtra, India.
- **Transliteration**: Representation of Marathi text using Roman (Latin) script to approximate pronunciation for learners unfamiliar with Devanagari.
- **XP (Experience Points)**: A numerical reward earned by the Learner for completing activities, used to progress through the leveling system.
- **PWA (Progressive Web App)**: A web application that can be installed on a device and provides an app-like experience, including offline support via Service Workers.
- **SSO (Single Sign-On)**: An authentication method allowing users to log in with an existing identity provider account — in this app, Google.
- **JWT (JSON Web Token)**: A compact, URL-safe token format used to persist authenticated sessions via access and refresh tokens.
- **COPPA (Children's Online Privacy Protection Act)**: A US federal law governing the collection of personal information from children under 13, requiring verifiable parental consent.
- **CDN (Content Delivery Network)**: A distributed network of servers used to deliver media assets (audio, images, animations) with low latency.
- **OTA (Over-The-Air) Update**: A mechanism to push app updates to mobile devices without requiring a full app store release (e.g., CodePush).
- **Learner**: A user of the app who is actively taking lessons and completing exercises.
- **Parent/Guardian**: An adult user who has linked their account to a child Learner's account for oversight purposes.
- **Streak**: A count of consecutive days on which the Learner has completed at least one activity.
- **Leaderboard**: A ranked display of Learners ordered by XP earned within a time period, shown to opted-in users.
- **Story Mode**: A narrative-driven lesson format in which the Learner participates in a scenario-based story requiring speaking, reading, and writing in Marathi.

---

## Requirements

### Requirement 1: Lesson-Based Learning

**User Story:** As a young learner (age 10–20), I want to access structured speaking lessons in Marathi, so that I can progressively learn to speak Marathi in everyday conversations.

#### Acceptance Criteria

1. THE App SHALL organize lessons by difficulty level: Beginner, Intermediate, and Advanced.
2. THE App SHALL assign each lesson a conversational topic (greetings, family, school, market, etc.).
3. THE App SHALL present every Marathi phrase with Devanagari script, Roman transliteration, and English meaning.
4. WHEN a phrase is displayed, THE App SHALL provide an audio pronunciation recording for that phrase.
5. THE App SHALL constrain each lesson to a completable duration of 5–10 minutes.
6. THE App SHALL integrate speaking (listen and repeat), writing (trace or write key words), and reading (read a short passage) skills within each lesson.

---

### Requirement 2: Interactive Speaking Practice

**User Story:** As a learner, I want to practice speaking Marathi and get feedback, so that I can improve my pronunciation and fluency.

#### Acceptance Criteria

1. THE App SHALL provide speech-to-text based pronunciation exercises.
2. WHEN a learner completes a speaking exercise, THE App SHALL allow the Learner to record their voice and compare it with the native pronunciation.
3. WHEN a pronunciation attempt is evaluated, THE App SHALL display a visual feedback score (0–100) indicating pronunciation accuracy, computed by comparing the transcribed text against the expected phrase using Levenshtein distance normalized by phrase length and clamped to [0, 100].
4. THE App SHALL use the browser Web Speech API (`mr-IN`) as the primary speech recognition engine on web (PWA), Hugging Face `vasista22/whisper-marathi` as the primary engine on mobile/server, Google Cloud Speech-to-Text as the server-side fallback when the primary is unavailable or times out, and Vosk on-device for offline mobile support.
5. WHEN speech recognition fails due to silence, noise, or a service error, THE App SHALL display a user-friendly prompt and allow the Learner to retry; after 3 failed attempts, THE App SHALL offer a skip option that awards 0 XP for that exercise and allows the Learner to continue.
6. THE App SHALL provide repeat and retry options for each speaking exercise with no limit on voluntary retries.

---

### Requirement 3: Learning to Write in Marathi (Devanagari)

**User Story:** As a learner, I want to learn how to write Marathi in Devanagari script, so that I can read and write Marathi alongside speaking it.

#### Acceptance Criteria

1. THE App SHALL provide Devanagari character lessons covering vowels (स्वर), consonants (व्यंजन), and conjuncts (जोडाक्षरे).
2. WHEN a writing exercise begins, THE App SHALL display an animated stroke-order demonstration before each attempt.
3. THE App SHALL provide a touch- and mouse-based drawing canvas for practicing characters.
4. WHEN a Learner submits a drawn character, THE App SHALL score the drawing against the expected character shape using handwriting recognition.
5. THE App SHALL sequence writing progression as: individual characters → conjuncts → words → short sentences.
6. THE App SHALL include spelling exercises in which the Learner listens to a Marathi word and writes it in Devanagari.
7. THE App SHALL include a dictation mode in which the Learner listens to a phrase and writes the full sentence in Devanagari.
8. WHEN a stroke is evaluated, THE App SHALL highlight correct strokes in green and incorrect strokes in red, and SHALL provide a retry option.
9. THE App SHALL integrate writing lessons into the level system: Beginner covers characters, Intermediate covers words, Advanced covers sentences.
10. THE App SHALL award XP for writing practice, including per character mastered and per word spelled correctly.

---

### Requirement 4: Learning to Read Marathi

**User Story:** As a learner, I want to practice reading Marathi text and improve my comprehension, so that I can understand written Marathi in everyday contexts.

#### Acceptance Criteria

1. THE App SHALL provide reading fluency exercises sequenced as: character recognition → word reading → sentence reading → paragraph reading.
2. WHEN a Learner activates read-aloud mode, THE App SHALL evaluate the Learner's pronunciation of displayed Marathi text via speech recognition.
3. THE App SHALL provide reading comprehension passages consisting of short Marathi stories or paragraphs followed by comprehension questions.
4. WHEN a Learner taps a word in a passage, THE App SHALL display the word's meaning, transliteration, and play its pronunciation audio.
5. THE App SHALL provide graded readers: age-appropriate Marathi stories organized by level from simple to complex.
6. THE App SHALL track reading speed in words per minute and display progress over time.
7. WHEN a Learner completes a passage, THE App SHALL present a comprehension quiz containing multiple-choice, true/false, and short-answer questions.
8. THE App SHALL integrate reading lessons into the level system: Beginner covers words and short sentences, Intermediate covers paragraphs, Advanced covers stories and articles.
9. THE App SHALL award XP for reading practice, including per passage completed and a bonus for comprehension score.

---

### Requirement 5: Progress Tracking

**User Story:** As a learner, I want to see my learning progress, so that I stay motivated and know what to learn next.

#### Acceptance Criteria

1. THE App SHALL display a dashboard showing completed lessons, current streak, and overall progress.
2. THE App SHALL award badges and rewards for milestones such as completing 5 lessons or maintaining a 7-day streak.
3. THE App SHALL highlight the next recommended lesson based on the Learner's current progress.

---

### Requirement 6: Deep Gamification and Interactivity

**User Story:** As a young learner, I want to have a game-like experience while learning, so that I stay engaged, compete with friends, and come back daily.

#### Acceptance Criteria

1. THE App SHALL implement an XP system that awards experience points for every activity, including lessons, quizzes, and speaking practice.
2. THE App SHALL implement a leveling system in which the Learner advances through titles (e.g., "Marathi Beginner" → "Marathi Champion") based on accumulated XP.
3. WHEN a lesson is completed, THE App SHALL present a quiz containing multiple-choice, fill-in-the-blank, match-the-pair, and speak-the-answer question types.
4. THE App SHALL provide timed challenges in which the Learner earns bonus XP for answering within a time limit.
5. THE App SHALL provide daily challenges with unique themes (e.g., "Market Day" — learn 5 market phrases).
6. THE App SHALL include speaking, writing, and reading challenge types within daily challenges.
7. THE App SHALL implement a streak system with a streak-freeze feature providing 1 free freeze per week.
8. WHERE a Learner opts in, THE App SHALL display a weekly leaderboard ranked by XP among the Learner's class or friends.
9. THE App SHALL provide collectible badges and achievements (e.g., "First Lesson", "7-Day Streak", "Perfect Quiz").
10. THE App SHALL provide unlockable avatar customizations earned through XP accumulation.
11. THE App SHALL provide a story mode in which the Learner helps a character navigate Marathi scenarios by speaking dialogues, reading signs and letters, and writing notes and messages.
12. THE App SHALL include mini-games: word scramble, phrase builder, audio matching, rapid-fire translation, reading speed race, and character tracing race.
13. THE App SHALL provide haptic and sound feedback on correct and incorrect answers.
14. THE App SHALL display animated celebrations (confetti, character animations) on milestone achievements.

---

### Requirement 7: Fun Facts — Maharashtra and Marathi Literature

**User Story:** As a learner, I want to discover interesting facts about Maharashtra and Marathi literature, so that I develop cultural appreciation alongside language skills.

#### Acceptance Criteria

1. THE App SHALL display "Did You Know?" fact cards between lessons or after quiz completion.
2. THE App SHALL source facts from the following categories: Maharashtra geography, festivals, food, historical figures, Marathi literature, poets, proverbs.
3. THE App SHALL present each fact in both English and Marathi, including transliteration.
4. THE App SHALL organize facts into categories: History, Literature, Culture, Food, Nature, and Festivals.
5. WHEN a Learner taps the heart icon on a fact, THE App SHALL save that fact to the Learner's personal collection for later review.
6. THE App SHALL display one "Fact of the Day" on the home screen each day.
7. THE App SHALL include related Marathi vocabulary within each fact (e.g., a Diwali fact includes "दिवाळी", "पणती", "फराळ").
8. THE App SHALL present occasional mini-quizzes on previously shown facts, awarding bonus XP for correct answers.

---

### Requirement 8: User Sign-Up and Login via Google SSO

**User Story:** As a learner or parent, I want to sign up and log in using my Google account, so that I can quickly access the app without creating a separate password.

#### Acceptance Criteria

1. THE App SHALL display a "Sign in with Google" button on the login and signup screen.
2. WHEN a new user completes Google sign-in for the first time, THE App SHALL automatically register the user using the name, email address, and avatar from the user's Google profile.
3. WHEN a new user completes registration, THE App SHALL present an age verification prompt to assign either a Learner or Parent role.
4. WHEN a returning user initiates Google sign-in, THE App SHALL recognize the existing account and log the user in directly.
5. THE App SHALL persist sessions using JWT access tokens and refresh tokens.
6. THE App SHALL support Google sign-in on both web (Google Identity Services) and mobile (Google Sign-In SDK).
7. WHEN a user indicates an age under 13, THE App SHALL trigger a parental consent flow.
8. THE App SHALL allow a Parent to link their Google account to a child Learner's account.

---

### Requirement 9: Parent and Guardian Oversight

**User Story:** As a parent/guardian, I want to monitor my child's learning progress and control their experience, so that I can support their Marathi learning journey safely.

#### Acceptance Criteria

1. THE App SHALL provide a parent dashboard displaying the child Learner's activity, lessons completed, time spent, current streak, and XP progress.
2. THE App SHALL NOT display advertisements or enable in-app purchases without explicit parental consent.
3. THE App SHALL restrict all content to safe and age-appropriate material.
4. WHEN a user is under 13, THE App SHALL restrict social features including leaderboard participation, custom display names, and any peer-to-peer interaction.
5. WHEN a Learner under 13 appears on a leaderboard, THE App SHALL display only their first name and last initial (e.g., "Aarav S.") and SHALL NOT expose their full name or profile photo.
6. THE App SHALL require a parental re-authentication gate (re-entry of Google credentials) before allowing changes to account settings, linked accounts, or notification preferences for under-13 users.
7. THE App SHALL allow a Parent to unlink their account from a child Learner's account at any time.

---

### Requirement 10: Non-Functional Requirements

**User Story:** As a product owner, I want the app to meet platform, performance, and compliance standards, so that it is reliable, accessible, and trustworthy for all users.

#### Acceptance Criteria

1. THE App SHALL be available as a PWA (installable from a browser) and as native apps on iOS (App Store) and Android (Google Play Store).
2. THE App SHALL use Supabase PostgreSQL as its primary database, Supabase Realtime for live sync, and Vercel Serverless Functions for all server-side logic. No Firebase paid services (Functions, Storage, Hosting, App Hosting) shall be used.
3. THE App SHALL present the UI in English with Marathi content displayed in Devanagari script and Roman transliteration.
4. WHEN a lesson is requested, THE App SHALL load the lesson within 2 seconds, and SHALL render animations at 60 frames per second.
5. THE App SHALL make core lessons available offline after the Learner downloads them, on both PWA and mobile.
6. THE App SHALL support screen readers and large text options in accordance with accessibility standards.
7. THE App SHALL comply with COPPA for users under 13 years of age.
8. THE App SHALL send push notifications for streaks, daily challenges, and the Fact of the Day.
9. THE App SHALL provide touch and click feedback on all interactive elements with smooth transitions.
10. THE App SHALL include a PWA manifest with an install prompt, app icons, and a splash screen, and SHALL provide native app store listings with screenshots and descriptions.
11. THE App SHALL auto-update the PWA via Service Worker, and SHALL deliver mobile app updates via OTA updates (CodePush) for minor versions and app store releases for major versions.
12. THE App SHALL enforce Supabase Auth JWT verification on all protected Vercel API routes; Vercel Functions SHALL apply rate limiting of 100 requests per minute per authenticated user, validate all inputs using Zod, enforce CORS to a whitelist of known origins, and apply HTTP security headers (Content-Security-Policy, X-Frame-Options, HSTS) on the web layer.
13. THE App SHALL serve audio as MP3 at 128 kbps, images as WebP with JPEG fallback, and Lottie animations lazy-loaded, delivered from Supabase Storage with aggressive caching headers.
14. THE App SHALL apply a PWA caching strategy of cache-first for the app shell, stale-while-revalidate for content, network-first for API responses, within a cache budget of approximately 200 MB.

---

### Requirement 11: Gamified Journey Map

**User Story:** As a learner, I want to see my learning progress visualized as a physical journey across Maharashtra toward Pune, so that I stay motivated by a sense of adventure and forward movement.

#### Acceptance Criteria

1. WHEN a new user completes onboarding, THE App SHALL prompt the Learner to select a starting city from a set of Maharashtra cities (e.g., Mumbai, Nagpur, Aurangabad, Nashik) and initialize their journey route to Pune.
2. THE App SHALL display an interactive map showing the Learner's route from their starting city to Pune, with labeled checkpoints representing towns or landmarks along the way.
3. THE App SHALL render a Learner avatar on the map at a position that reflects the Learner's accumulated XP relative to the total XP required to complete the route.
4. WHEN the Learner accumulates enough XP to reach a checkpoint, THE App SHALL unlock that checkpoint, reveal the lessons and cultural trivia associated with it, and display a milestone celebration animation.
5. THE App SHALL visually distinguish checkpoint states: locked (grayed out), current (highlighted/pulsing), and completed (marked).
6. WHEN a Learner taps a completed or current checkpoint on the map, THE App SHALL display a detail view showing the checkpoint name in Marathi and English, unlocked lessons, and associated cultural trivia.
7. THE App SHALL update the avatar's position on the map in real time as XP is earned, without requiring a page reload.
8. WHEN a Learner reaches Pune (completes the full route), THE App SHALL display a journey completion celebration, award a "Pune Explorer" badge, and offer the option to begin a new journey from a different starting city.
