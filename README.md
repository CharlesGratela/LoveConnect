# NxtDate

AI-powered dating app built with Next.js 15, Supabase, OpenAI, and web push notifications.

## Current Architecture

The app now supports a Supabase-based production path with:

- Supabase Auth
- Supabase Postgres for profiles, swipes, matches, messages, blocks, reports, and push subscriptions
- Supabase Storage for profile photos
- Supabase Realtime for live chat and match refreshes
- OpenAI embeddings plus collaborative filtering for recommendations

Legacy MongoDB codepaths still exist as fallback in parts of the repo, but the active migration path is Supabase.

## Core Features

- Email signup, login, logout, and profile management
- Swipe discovery with age and distance filters
- AI-ranked recommendations
- Mutual matches and realtime chat
- Push notifications for likes, matches, and messages
- Blocking and reporting
- Moderation dashboard for allowlisted admins
- Profile completeness scoring
- Compatibility hints and conversation starters

## Main Routes

- `/auth`
- `/discover`
- `/matches`
- `/chat/[matchId]`
- `/profile`
- `/admin/reports`

## Required Environment Variables

```env
NEXT_PUBLIC_AUTH_PROVIDER=supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=profile-photos
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-api-key
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:you@example.com
ADMIN_EMAILS=admin@example.com
NEXT_PUBLIC_ADMIN_EMAILS=admin@example.com
```

See [.env.example](./.env.example) for the full list.

## Supabase SQL Setup

Run these migration files in order:

1. `supabase/migrations/0001_phase1_profiles.sql`
2. `supabase/migrations/0002_phase2_storage.sql`
3. `supabase/migrations/0003_phase3_core_data.sql`
4. `supabase/migrations/0004_phase4_realtime.sql`
5. `supabase/migrations/0005_phase5_ai_matching.sql`
6. `supabase/migrations/0006_phase6_safety_and_quality.sql`

## Local Development

```bash
npm install
npm run dev
```

App URL:

- `http://localhost:3000`

## Deployment Notes

- Add the same environment variables to Vercel
- Add your local and production domains to Supabase Auth settings
- Add `/auth/callback` to Supabase redirect URLs
- Ensure the Realtime publication contains `messages` and `matches`

## Rollout Guide

Use [PRODUCTION_ROLLOUT_CHECKLIST.md](./PRODUCTION_ROLLOUT_CHECKLIST.md) before switching production fully to Supabase mode.
