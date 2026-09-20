# Pulsecheck

Glassmorphic **Account Health Dashboard** template for Customer Success. Single-user by design — each signed-in user has their own private workspace of customer accounts.

Built on TanStack Start + Lovable Cloud (Supabase) with teal/glass design tokens, mobile-first layouts, and end-to-end RLS from the first commit.

## Feature overview

- Public landing, auth, and docs pages
- Google + Email/Password sign in
- 3-step resumable onboarding (profile → company → data)
- Dashboard: status breakdown, ARR at risk, upcoming renewals (30/60/90d), highest-risk accounts
- Accounts list with search + status/segment/CSM filters, add/edit/delete
- Account detail with health-score slider, ticket/NPS/CSAT inputs, and status history
- Analytics with health distribution, status split, ARR by segment
- CSV import with header auto-mapping + downloadable template
- CSV export of current data
- Settings: profile, "Connect your tools" (placeholder for SFDC/HubSpot/Zendesk/Gainsight), clear all accounts

## Data model

| Table | Purpose |
| --- | --- |
| `profiles` | 1 row per auth user. Full name, job title, company, industry, size, onboarding progress. Primary key = `auth.users.id`. |
| `accounts` | Customer accounts owned by a user. `user_id` FK, ARR in cents, health_score, status (auto-derived), renewal date, segment, CSM, tickets, NPS/CSAT, notes. |
| `account_status_history` | Row per status change. Written by a trigger on `accounts`. |

### Triggers

- **`accounts` BEFORE INSERT/UPDATE** → derives `status` from `health_score` (70+ Healthy, 40–69 At Risk, <40 Critical) and stamps `updated_at`.
- **`accounts` AFTER UPDATE** → when `status` changes, inserts a row into `account_status_history`.
- **`auth.users` AFTER INSERT** → creates an empty `profiles` row (avoids the client ever inserting its own profile).

## RLS model — user_id-scoped

Every table has RLS enabled. Policies are strictly scoped to `auth.uid()`:

- `profiles`: `id = auth.uid()` for SELECT / UPDATE. No INSERT policy (rows are created by the signup trigger).
- `accounts`: `user_id = auth.uid()` for SELECT / INSERT / UPDATE / DELETE.
- `account_status_history`: `user_id = auth.uid()` for SELECT; INSERT is done by a SECURITY DEFINER trigger only.

Server functions use `requireSupabaseAuth`, which validates the bearer token and gives the handler an authenticated Supabase client (`context.supabase`) plus `context.userId`. **`user_id` is always taken from `context.userId`, never trusted from the client body.**

Security definer functions pin `search_path = public` and `EXECUTE` is revoked from `anon`.

## Google OAuth

Managed Google auth works out of the box via Lovable Cloud (no keys required). If you want to brand the consent screen with your own OAuth client:

1. In the Cloud dashboard → Users → Authentication Settings → Sign In Methods → Google, switch to "Use your own credentials".
2. Create a Google Cloud OAuth client (Web app), authorize the domain shown in the panel, and add the Supabase callback URL listed there as an authorized redirect URI.
3. Paste in the client ID and secret and save.

Google sign-in is called from `src/routes/auth.tsx` via `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })`.

## Remix instructions

**Carries over on remix:** UI, routes, design tokens, server functions, migrations (schema + RLS + triggers).

**Does NOT carry over:** any accounts, profiles, sample data — every remix starts on a fresh Cloud instance with an empty database.

**After remix:**

- Update the app title/description in `src/routes/__root.tsx`.
- Replace teal/brand tokens in `src/styles.css` if rebranding.
- If you want your own Google OAuth client, follow the steps above.

## Known gaps

- No live connectors (Salesforce / HubSpot / Zendesk / Gainsight) — the Settings integration cards are intentionally placeholders.
- Health score is manual; there is no ML/scoring engine.
- CSV import runs in the browser and is intended for files up to a few MB.
- Analytics show a snapshot; long-range trend charts beyond `account_status_history` are out of scope.
- Single-user by design — no team sharing, roles, or organizations.

## Tech stack

TanStack Start · React 19 · Tailwind v4 · shadcn primitives · Recharts · Papa Parse · Lovable Cloud (Supabase auth, DB, RLS).
