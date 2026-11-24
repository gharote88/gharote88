# Spec-Driven Development Commands & Workflows

> **Status**: All 39 implementation tasks complete. This document reflects the delivered Supabase + Vercel + Expo stack.

---

## Daily Development Commands

```bash
# API — Vercel dev server (from /api)
vercel dev                        # runs at http://localhost:3000

# Mobile app (from /packages/app)
npx expo start                    # Expo dev server
npx expo run:ios                  # iOS simulator
npx expo run:android              # Android emulator

# Web (from /packages/web)
npm run dev                       # Vite dev server at http://localhost:5173

# Root
npm run lint                      # ESLint all packages
npm run format                    # Prettier all packages
npm run build:shared              # Compile shared package first
```

---

## Supabase Commands

```bash
# Run migrations against dev project
supabase db push --db-url postgresql://postgres:<pw>@db.<ref>.supabase.co:5432/postgres

# Run migrations against prod project
supabase db push --db-url postgresql://postgres:<pw>@db.<prod-ref>.supabase.co:5432/postgres

# Generate TypeScript types from schema
supabase gen types typescript --project-id <ref> > packages/shared/src/database.types.ts

# Local Supabase dev (optional)
supabase start                    # starts local Supabase stack
supabase stop
```

---

## Vercel Commands

```bash
# Link project (run once from repo root)
vercel link

# Preview deploy
vercel

# Production deploy
vercel --prod

# Add environment variable
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add HF_API_TOKEN
vercel env add GOOGLE_CLOUD_KEY_FILE
vercel env add GOOGLE_CLOUD_PROJECT_ID

# View logs
vercel logs
```

---

## EAS Build Commands

```bash
cd packages/app

# Configure EAS (run once)
eas build:configure

# Development build
eas build --platform all --profile development

# Production build
eas build --platform ios --profile production
eas build --platform android --profile production
eas build --platform all --profile production

# Submit to stores
eas submit --platform ios
eas submit --platform android

# Add EAS secrets
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "..."
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "..."
eas secret:create --scope project --name EXPO_PUBLIC_API_BASE_URL --value "..."
```

---

## Testing Commands

```bash
# Unit tests
npm test

# Unit tests with coverage
npm test -- --coverage

# Type-check API routes
cd api && npx tsc --noEmit

# Type-check web
cd packages/web && npx tsc --noEmit

# Security audit
npm audit
```

---

## Spec-Driven Development Checklist

### Before starting a new feature
- [ ] Review relevant spec file in `.kiro/specs/marathi-learning-app/`
- [ ] Check `tasks.md` for task definition and acceptance criteria
- [ ] Verify Supabase migration exists if new tables are needed
- [ ] Create feature branch from `main`

### During development
- [ ] Follow spec requirements exactly
- [ ] Add Zod validation to new API routes
- [ ] Add `vercel.json` rewrite if new dynamic route
- [ ] Write unit tests for pure functions (scoring, XP, streak logic)

### After completing a feature
- [ ] Run `npm test` — all tests pass
- [ ] Run `npx tsc --noEmit` — no type errors
- [ ] Run `npm run lint` — no lint errors
- [ ] Mark task `[x]` in `tasks.md`
- [ ] Open PR for review

---

## Key File Locations

| What | Where |
|------|-------|
| API routes | `api/<resource>/` |
| Dynamic route rewrites | `vercel.json` |
| DB migrations | `supabase/migrations/` |
| Shared types | `packages/shared/src/index.ts` |
| Auth helpers | `packages/shared/src/supabaseAuth.ts` |
| Mobile screens | `packages/app/src/screens/` |
| Expo router entries | `packages/app/<route>.tsx` |
| Web pages | `packages/web/src/pages/` |

---

**Last Updated**: 2026-09-10
**Version**: 2.0
**Status**: All 39 tasks complete
