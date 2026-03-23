# Supabase Migration Tracker

This file tracks the planned migration of the current custom MongoDB/JWT backend to Supabase.

## Overall Goal

Migrate the dating app backend to Supabase in controlled phases without breaking the core product loop:

- Authentication
- Profiles
- Discovery
- Likes and matches
- Messaging
- Push notifications
- AI-powered recommendations

## Status Legend

- `[ ]` Not started
- `[~]` In progress
- `[x]` Completed
- `[-]` Deferred

## Phase 0: Pre-Migration Cleanup

Status: `[ ]`

Goal:
Stabilize the current codebase before moving infrastructure.

Tasks:
- [ ] Audit auth flow and remove fragile client-side session fallbacks where possible
- [ ] Fix unmatch authorization checks
- [ ] Fix message authorization checks so only members of a match can send messages
- [ ] Identify all MongoDB-specific code paths
- [ ] Document current environment variables and backend dependencies
- [ ] Update README notes that no longer reflect the actual architecture plan

Notes:
- Current chat is polling-based, not true realtime
- Current matching generates embeddings on demand, which is costly

## Phase 1: Supabase Auth and Profiles

Status: `[x]`

Goal:
Move authentication and user profile ownership to Supabase Auth + Postgres.

Tasks:
- [x] Add Supabase client and server libraries
- [x] Create Supabase project and environment variables documentation
- [~] Replace custom JWT auth with Supabase Auth
- [x] Create `profiles` table linked to `auth.users`
- [x] Move registration/login/logout flows to Supabase Auth
- [x] Move email verification flow to Supabase Auth
- [x] Refactor auth context to read from Supabase session
- [x] Migrate profile reads and updates to Supabase-backed queries

Notes:
- Keep profile schema close to existing app behavior first
- Avoid changing UI behavior too much during this phase
- Auth provider switching is currently controlled by `NEXT_PUBLIC_AUTH_PROVIDER`
- Legacy mode still exists so the rest of the backend can keep working during later phases

## Phase 2: Storage Migration

Status: `[~]`

Goal:
Replace base64 and URL-only profile image handling with Supabase Storage.

Tasks:
- [x] Create storage bucket(s) for profile photos
- [~] Replace base64 upload flow with direct file upload
- [x] Store photo URLs in profile records
- [ ] Add support for multiple profile photos
- [x] Define upload access rules and cleanup strategy

Notes:
- This phase is a strong opportunity to introduce photo gallery support
- Authenticated profile photo uploads now use Supabase Storage
- Signup still uses a temporary preview flow in Supabase mode until the later backend phases fully remove legacy assumptions

## Phase 3: Likes, Matches, and Messaging Data

Status: `[~]`

Goal:
Move core relational app data from MongoDB to Supabase Postgres.

Tasks:
- [x] Create `swipes` table
- [x] Create `matches` table
- [x] Create `messages` table
- [x] Create `push_subscriptions` table if push remains custom
- [x] Port `/api/swipe` behavior to Supabase-backed logic
- [x] Port `/api/matches` behavior to Supabase-backed logic
- [x] Port `/api/messages` behavior to Supabase-backed logic
- [x] Add canonical uniqueness constraints for match pairs
- [x] Add indexes for inbox, unread, and discovery queries

Notes:
- This is where the backend starts to feel truly relational
- Added a temporary Supabase-backed discover flow so swiping works before the later AI matching refactor
- Push subscriptions and push fanout can now read from Supabase when `SUPABASE_SERVICE_ROLE_KEY` is configured

## Phase 4: Realtime Messaging and Live Events

Status: `[x]`

Goal:
Use Supabase Realtime for chat and match-related updates.

Tasks:
- [x] Subscribe to new messages via Supabase Realtime
- [x] Remove 3-second polling from chat page
- [x] Add message delivery and read-state updates
- [x] Optionally add live match creation events
- [-] Test reconnect behavior on flaky mobile connections

Notes:
- This phase should produce an immediate UX improvement
- Chat now uses Supabase Realtime in Supabase mode and keeps the legacy polling fallback for legacy mode
- Matches page now refreshes live when match records change
- Incoming messages are marked as read in Supabase mode, but read receipts are not yet surfaced in the UI

## Phase 5: AI Matching Refactor

Status: `[x]`

Goal:
Keep AI matching logic, but stop recomputing embeddings during every discovery request.

Tasks:
- [x] Create `user_embeddings` storage strategy
- [x] Generate embeddings only when relevant profile fields change
- [x] Store compatibility inputs in a query-friendly format
- [x] Refactor discovery pipeline to reuse stored embeddings
- [x] Re-evaluate collaborative filtering implementation against Postgres data
- [-] Consider pgvector if vector search is needed

Notes:
- Recommendation logic can remain server-side even after moving to Supabase
- Supabase discover now uses OpenAI embeddings plus collaborative filtering again
- Embeddings are cached in `user_embeddings` and regenerated when the profile hash changes
- Current implementation stores embeddings as JSON for portability; pgvector can still be introduced later if needed

## Phase 6: Safety and Dating-App Product Upgrades

Status: `[~]`

Goal:
Use the migration window to improve trust, moderation, and retention.

Tasks:
- [x] Add block feature
- [x] Add report feature
- [x] Add moderation/admin review workflow
- [x] Add profile completeness scoring
- [x] Add unread counts and read receipts
- [x] Add compatibility explanation UI
- [x] Add conversation starters

Notes:
- These features are especially important for a dating app, not just nice-to-have
- Blocked users are filtered from Supabase discover and matches flows
- Discover cards now surface lightweight compatibility reasons alongside the AI score
- Match cards now show unread counts, and profile settings show completeness progress
- Admin moderation is now available via an email allowlist and a simple reports dashboard
- Chat now includes conversation starter prompts for new matches

## Suggested Table Outline

Planned core tables:

- `profiles`
- `profile_photos`
- `swipes`
- `matches`
- `messages`
- `push_subscriptions`
- `user_embeddings`
- `blocks`
- `reports`

## Current Progress Log

- [x] Initial repo analysis completed
- [x] High-level migration phases defined
- [x] Supabase schema draft created
- [x] RLS policy draft created
- [x] Initial Phase 1 implementation started
- [x] Supabase SSR client and middleware scaffolded
- [x] Auth context updated for dual legacy/Supabase support
- [x] Auth callback route added for Supabase email confirmation
- [x] Project builds successfully after Phase 1 foundation changes
- [x] Supabase Storage migration and policies drafted
- [x] Profile page uploads now target Supabase Storage in Supabase mode
- [x] Next.js image config updated for Supabase-hosted images
- [x] Core swipes, matches, messages, and push subscription schema added for Supabase
- [x] Discover, swipe, match, message, and likes APIs now support Supabase mode
- [x] Project builds successfully after Phase 3 route migration
- [x] Realtime publication SQL added for messages and matches
- [x] Chat page now subscribes to new Supabase messages instead of polling
- [x] Matches page now refreshes on Supabase match changes
- [x] Project builds successfully after Phase 4 realtime migration
- [x] User embedding cache table added for Supabase mode
- [x] Discover route now uses AI-ranked Supabase recommendations again
- [x] Collaborative filtering logic ported to Postgres-backed swipes
- [x] Project builds successfully after Phase 5 AI matching migration
- [x] Safety schema added for blocks and reports
- [x] Block and report APIs added for Supabase mode
- [x] Profile completeness and match unread counts surfaced in the UI
- [x] Project builds successfully after Phase 6 safety and quality pass
- [x] Admin reports dashboard and report status workflow added
- [x] Conversation starter prompts added to chat

## Decisions to Keep Visible

- Use Supabase for auth, database, storage, and realtime
- Keep AI recommendation orchestration in controlled server logic
- Prefer phased migration over a full rewrite
- Preserve current UX first, then improve product capabilities
