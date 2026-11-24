# Production Deployment Guide

## Stack

| Layer | Service |
|-------|---------|
| Web hosting + API | Vercel (Serverless Functions) |
| Database + Auth + Realtime | Supabase (PostgreSQL) |
| Mobile app | Expo EAS Build + EAS Submit |
| Speech recognition (primary) | Hugging Face `vasista22/whisper-marathi` |
| Speech recognition (fallback) | Google Cloud Speech-to-Text |
| Push notifications | OneSignal |
| CI/CD | GitHub Actions → Vercel + EAS |

---

## Prerequisites

```bash
npm install -g vercel
npm install -g eas-cli
```

---

## 1. Supabase Setup

### Create projects
- **Dev**: used for Development + Preview Vercel environments
- **Prod**: used for Production Vercel environment only

### Run migrations
```bash
# Against dev project
supabase db push --db-url postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres

# Against prod project (same migrations)
supabase db push --db-url postgresql://postgres:<password>@db.<prod-project-ref>.supabase.co:5432/postgres
```

Migrations run in order from `supabase/migrations/`:
| File | Contents |
|------|----------|
| `001_initial_schema.sql` | All tables |
| `002_seed_journey_routes.sql` | 5 starting cities + checkpoints |
| `003_seed_badges.sql` | Badge definitions |
| `004_seed_lessons.sql` | Lesson catalogue |
| `005_seed_phrases.sql` | Phrases per lesson |
| `006_seed_quiz_questions.sql` | Quiz questions |
| `007_seed_writing_characters.sql` | Devanagari character stroke data |
| `008_rls_policies.sql` | Row Level Security policies |
| `009_seed_fun_facts.sql` | 102 cultural fun facts |

### Enable Realtime
In Supabase dashboard → Database → Replication, enable Realtime for:
- `journey_progress`
- `users`

### Storage buckets
Create three buckets in Supabase Storage (all public read):
- `audio` — phrase and passage audio files
- `images` — lesson and story images
- `avatars` — user avatar assets

---

## 2. Vercel Setup

### Link project
```bash
cd /path/to/repo
vercel link
```

### Add environment variables
In Vercel dashboard → Settings → Environment Variables, add:

| Key | Environments | Where to get it |
|-----|-------------|-----------------|
| `SUPABASE_URL` | All | Supabase dashboard → Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Dev/Preview: dev project · Production: prod project | Supabase → Settings → API → service_role key |
| `HF_API_TOKEN` | All | [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) → New token (read) |
| `GOOGLE_CLOUD_PROJECT_ID` | All | Google Cloud Console → project ID |
| `GOOGLE_CLOUD_KEY_FILE` | All | Paste full contents of service account JSON file |

### Deploy
```bash
# Preview deploy
vercel

# Production deploy
vercel --prod
```

---

## 3. Expo / EAS Setup

### Configure app
Update `packages/app/app.json`:
- Set `expo.slug` to your app slug
- Set `expo.ios.bundleIdentifier` (e.g. `com.yourname.marathilearning`)
- Set `expo.android.package` (e.g. `com.yourname.marathilearning`)

### Set EAS environment variables
```bash
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://<ref>.supabase.co"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "<anon-key>"
eas secret:create --scope project --name EXPO_PUBLIC_API_BASE_URL --value "https://<your-project>.vercel.app"
```

### Build
```bash
cd packages/app

# iOS
eas build --platform ios --profile production

# Android
eas build --platform android --profile production

# Both
eas build --platform all --profile production
```

### Submit to stores
```bash
# App Store (requires Apple Developer account)
eas submit --platform ios

# Google Play (requires Google Play Console account)
eas submit --platform android
```

---

## 4. GitHub Actions Secrets

Set these in **Settings → Secrets and variables → Actions**:

| Secret | Description |
|--------|-------------|
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens |
| `VERCEL_ORG_ID` | Vercel → Account Settings → General → Your ID |
| `VERCEL_PROJECT_ID` | Vercel → Project Settings → General → Project ID |
| `EXPO_TOKEN` | [expo.dev/accounts/settings/access-tokens](https://expo.dev/accounts/settings/access-tokens) |
| `SUPABASE_DB_URL` | `postgresql://postgres:<pw>@db.<ref>.supabase.co:5432/postgres` (prod) |
| `HF_API_TOKEN` | HuggingFace token (for cron jobs) |

---

## 5. Local Development

### API (Vercel dev server)
```bash
cd api
cp .env.example .env   # fill in real values
vercel dev             # runs at http://localhost:3000
```

### Expo app
```bash
cd packages/app
cp .env.example .env   # set EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
npx expo start
```

### Web
```bash
cd packages/web
npm run dev            # runs at http://localhost:5173
```

---

## 6. CI/CD Pipeline

The GitHub Actions workflow at `.github/workflows/ci.yml` runs on every push to `main`:

1. Lint + type-check
2. Unit tests
3. Build
4. Deploy API to Vercel (production)
5. Trigger EAS build (mobile)

### Cron jobs
| Workflow | Schedule | Purpose |
|----------|----------|---------|
| `fact-of-the-day.yml` | Daily 03:30 UTC (9 AM IST) | Rotate daily fun fact |
| `scheduled-cleanup.yml` | Weekly Monday 00:00 UTC | Leaderboard aggregation + streak resets |

---

## 7. Monitoring

| Tool | What it covers |
|------|---------------|
| Vercel Analytics | API function latency, error rates, web vitals |
| Vercel Logs | Real-time function logs (`vercel logs`) |
| Supabase Dashboard | Database metrics, query performance, auth events |
| Sentry (free tier) | Mobile + web crash reporting — add `SENTRY_DSN` to env |
| HuggingFace dashboard | Inference API usage and rate limit status |
| Google Cloud Console | Speech-to-Text usage against 60 min/month free quota |

---

## 8. Rotating Secrets

If any secret is compromised:

- **`SUPABASE_SERVICE_ROLE_KEY`** — Supabase dashboard → Settings → API → Regenerate. Update Vercel env var + GitHub secret immediately.
- **`HF_API_TOKEN`** — huggingface.co/settings/tokens → Revoke → Create new. Update Vercel + GitHub + EAS secrets.
- **`GOOGLE_CLOUD_KEY_FILE`** — Google Cloud Console → IAM → Service Accounts → Keys → Delete old key → Add new key → update Vercel env var.
