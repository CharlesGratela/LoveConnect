# Production Rollout Checklist

Use this checklist before switching the production app fully to Supabase mode.

## Supabase SQL

- [ ] Run `supabase/migrations/0001_phase1_profiles.sql`
- [ ] Run `supabase/migrations/0002_phase2_storage.sql`
- [ ] Run `supabase/migrations/0003_phase3_core_data.sql`
- [ ] Run `supabase/migrations/0004_phase4_realtime.sql`
- [ ] Run `supabase/migrations/0005_phase5_ai_matching.sql`
- [ ] Run `supabase/migrations/0006_phase6_safety_and_quality.sql`

## Local Environment

- [ ] Set `NEXT_PUBLIC_AUTH_PROVIDER=supabase`
- [ ] Set `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Set `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- [ ] Set `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=profile-photos`
- [ ] Set `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Set `OPENAI_API_KEY`
- [ ] Set `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- [ ] Set `VAPID_PRIVATE_KEY`
- [ ] Set `VAPID_SUBJECT`
- [ ] Set `ADMIN_EMAILS`
- [ ] Set `NEXT_PUBLIC_ADMIN_EMAILS`

## Supabase Dashboard

- [ ] Add local and production domains to Auth `Site URL`
- [ ] Add `/auth/callback` URLs to Auth `Redirect URLs`
- [ ] Confirm `profile-photos` bucket exists
- [ ] Confirm Realtime publication includes `messages` and `matches`

## Vercel Environment

- [ ] Add all matching Supabase env vars to Vercel
- [ ] Add OpenAI and VAPID env vars to Vercel
- [ ] Add admin allowlist env vars to Vercel
- [ ] Redeploy after env changes

## Smoke Tests

- [ ] Sign up with a new user
- [ ] Confirm email link works
- [ ] Log in successfully
- [ ] Update profile and upload a photo
- [ ] Confirm discover returns profiles
- [ ] Swipe like/dislike works
- [ ] Confirm a mutual like creates a match
- [ ] Confirm chat receives realtime updates
- [ ] Confirm unread counts appear on matches
- [ ] Confirm blocking removes users from discover and matches
- [ ] Confirm reporting creates moderation records
- [ ] Confirm admin can open `/admin/reports`
- [ ] Confirm push notifications still work

## Post-Launch Cleanup

- [ ] Decide whether to keep legacy Mongo fallback
- [ ] Remove legacy MongoDB-only docs if no longer needed
- [ ] Rotate any keys that were pasted into chats or shared accidentally
