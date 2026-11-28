# Journey Map — Design & Curriculum Plan

> Last updated: 2025-07-11
> Figma file: `ty53TAffhzHAPSpW8snnUz` (Page 3 — ✍️ Writing + 🗺️ Journey)

---

## Concept

The entire state of Maharashtra is the game board. Each city = one level. Completing all lessons + challenges for that city unlocks the next city and moves the user's avatar there. The journey progresses West → East, from Mumbai on the Konkan coast to Nagpur in Vidarbha.

---

## 12-City Curriculum

Each city covers a skill level (what you can do with Marathi) and a content type (what you're working with), across all 3 modalities — Reading, Writing, Speaking.

| Level | City | Region | Content | Reading | Writing | Speaking |
|-------|------|--------|---------|---------|---------|---------|
| 1 | Mumbai | Konkan Coast | Vowels | Read vowel cards | Trace vowels (अ आ इ ई उ ऊ...) | Speak vowels |
| 2 | Pune | Western Ghats | Consonants | Read consonant cards | Trace consonants (क ख ग घ...) | Speak consonants |
| 3 | Nashik | Godavari Valley | Numbers | Read 1–100, ordinals, time | Write numbers | Count aloud |
| 4 | Ahmednagar | Deccan Plateau | Basic Words | Word cards (body parts, colors, animals, fruits) | Write words | Name objects aloud |
| 5 | Shirdi | North Deccan | More Words | Vocabulary passages (family, home, food, market) | Word dictation | Word pronunciation |
| 6 | Aurangabad | Marathwada | Simple Sentences | Read sentences (greetings, "I am / I have / I want") | Write sentences | Speak sentences |
| 7 | Latur | South Marathwada | Daily Sentences | Short dialogues, Q&A | Sentence dictation | Conversation practice |
| 8 | Solapur | Eastern Deccan | Short Paragraphs | 3–5 sentence passages + comprehension | Paragraph writing | Read aloud scoring |
| 9 | Kolhapur | Southern Maharashtra | Paragraphs | Longer passages, storytelling | Story writing | Storytelling |
| 10 | Satara | Sahyadri Hills | Children's Poems | Classic Marathi bal-kavita | Write poems from memory | Recite poems |
| 11 | Ratnagiri | Konkan South | Famous Poems | Poems by Bal Gandharva, Mangesh Padgaonkar | Write from memory | Recitation with pronunciation scoring |
| 12 | Nagpur | Vidarbha (Final) | Full Fluency | Mixed passages + poetry | Free writing | Full conversation |

---

## City Node States (5 states)

| State | Cities | Visual |
|-------|--------|--------|
| Completed | Levels already finished | Teal filled circle `#2A9D8F` + white ✓ |
| Current | User's active level | Saffron `#E76F51` + double pulse ring + avatar 🧑 on top |
| Next (unlocked) | One level ahead | Gold `#F4A261` outlined circle, dashed border, tap to preview |
| Locked | All levels beyond next | Grey `#C8C8E0` + 🔒 icon, shows XP needed |
| Goal | Nagpur (Level 12) | Slate `#3D405B` + 🏆 icon + gold glow |

---

## Path Lines Between Cities

| Segment | Style |
|---------|-------|
| Completed → Completed | Solid teal `#2A9D8F`, 3px |
| Current → Next | Dashed gold `#F4A261`, 2px |
| Next → Locked (and beyond) | Dotted grey `#C8C8E0`, 2px |

---

## City Positions on 390×844 Frame

Geographically approximate positions on the Maharashtra silhouette:

| City | x | y | Notes |
|------|---|---|-------|
| Mumbai | 75 | 680 | SW coast |
| Pune | 110 | 600 | Western Ghats |
| Nashik | 130 | 490 | Godavari, NW |
| Ahmednagar | 195 | 530 | Deccan center |
| Shirdi | 175 | 430 | North Deccan |
| Aurangabad | 230 | 390 | Marathwada W |
| Latur | 255 | 530 | Marathwada S |
| Solapur | 195 | 610 | Eastern Deccan |
| Kolhapur | 90 | 660 | Southern MH |
| Satara | 130 | 640 | Sahyadri |
| Ratnagiri | 55 | 590 | Konkan South |
| Nagpur | 330 | 310 | Vidarbha, NE — Final Goal |

---

## Figma Screens to Build (3 frames on Page 3)

### Frame 1 — Journey Map (main screen)
- Maharashtra silhouette background (flat illustrated, green terrain blobs)
- Sticky header: "Maharashtra Journey" + current level + XP pill
- 12 city nodes at geographic positions with correct state styling
- Path lines connecting all cities (solid/dashed/dotted per state)
- City labels for done + current + next only (city name + level number)
- Avatar 🧑 on current city with double pulse ring
- Bottom sheet showing current city info:
  - City name + level badge
  - Content description (e.g. "Basic Words — Body parts, colors, animals")
  - 3 track pills: 📖 Reading · ✍️ Writing · 🗣️ Speaking
  - Progress bar
  - "Continue Level →" teal CTA

### Frame 2 — Level Complete (transition state)
- Confetti overlay
- "Level 4 Complete! 🎉" card
- XP earned: +320 XP
- Avatar shown mid-path between current city → next city
- "Shirdi Unlocked!" badge
- New lessons preview card

### Frame 3 — City Detail (bottom sheet, expanded on city tap)
- City name + region + level number
- Skill level description
- 3 lesson tracks with individual progress:
  - 📖 Reading: 4 lessons
  - ✍️ Writing: 4 lessons
  - 🗣️ Speaking: 4 lessons
- 2 daily challenges specific to this city
- Lock/unlock status per track
- XP required to unlock (if locked)

---

## Avatar Movement Logic (Dev Notes)

- On level complete → `POST /api/journey/update` with `{ city, xp_earned }`
- Supabase `journey_progress` row updates `current_city`, `completed_cities[]`
- Realtime subscription on `journey_progress` triggers avatar animation on map
- Avatar slides along path from old city → new city (CSS transition / Reanimated)
- New city's lessons + challenges unlock via `lesson.unlock_city = city_name` filter
- Supabase Realtime enabled on `journey_progress` and `users` tables

---

## Design Tokens (from Design System)

| Token | Value |
|-------|-------|
| Primary Teal | `#2A9D8F` |
| Slate Indigo | `#3D405B` |
| Saffron Accent | `#E76F51` |
| Turmeric Gold | `#F4A261` |
| Success Green | `#57CC99` |
| Light BG | `#FAFAF8` |
| Dark BG | `#1A1A2E` |
| Map BG | `#EDF4F2` |
| Terrain Fill | `#D4EDE8` |

---

## Decisions Log

| # | Question | Decision |
|---|----------|----------|
| 1 | Fixed vs variable lesson count per city? | **Variable** — lesson count scales with content complexity per city |
| 2 | City-specific challenges vs global daily pool? | **Lesson-based** — challenges unlock and are generated based on lessons the user has completed in that city |
| 3 | Dark mode Journey Map — now or later? | **Now** — build dark mode variant alongside light mode |
| 4 | Avatar on map — customized or generic fallback? | **Customized avatar** — use user's chosen avatar; fall back to a generic avatar if user skipped avatar setup |
| 5 | Offline behavior | **Defer** — decide later |

---

## Open Questions / To Discuss

- [ ] Offline behavior — can user see the map without internet? (read-only, no progress save)
- [ ] What is the generic fallback avatar ��� silhouette, initials circle, or a default character?
- [ ] Challenge generation logic — rule-based (e.g. "translate 5 words from this city's word list") or manually authored per city?
- [ ] Variable lesson count per city — what are the min/max bounds? (e.g. 3 min, 12 max?)
