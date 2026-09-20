## What I verified first

I queried the live database rather than assuming. Current state:

- RLS is **already enabled** on all three tables (`profiles`, `accounts`, `account_status_history`), and every existing policy is correctly scoped to `auth.uid()`.
- All server functions already run through authenticated middleware and take `user_id` from the verified session — never from client input.
- The database linter reports **no issues**.
- Roles: skipping, per your answer — Pulsecheck is single-user scoped with no admin surface.

So the foundation is sound. What's left are real gaps worth closing:

| Gap | Why it matters |
|---|---|
| Every policy targets the `public` role, and `anon` holds SELECT/INSERT/UPDATE/DELETE grants on all three tables | Anonymous requests currently reach the tables and are stopped only because `auth.uid()` is NULL. That's one permissive policy away from a leak. |
| `profiles` has no DELETE policy; `account_status_history` has no UPDATE/DELETE policy | Deny-by-default works, but the intent isn't recorded, and users can't delete their own profile row. |
| `handle_new_user` is SECURITY DEFINER with EXECUTE not explicitly revoked | Should never be callable by `anon`/`authenticated`. |
| Server functions use pass-through input validators (no schema validation) | Malformed or oversized input reaches the database unchecked. |

## Plan

### 1. Database migration — lock policies to authenticated only

- Recreate all nine existing policies with `TO authenticated` instead of the implicit `public` role, keeping the same `auth.uid()` conditions.
- Add `profiles` DELETE policy scoped to `auth.uid() = id`.
- Leave `account_status_history` UPDATE/DELETE with **no policy** — it's an append-only audit log, so deny-by-default is correct. I'll add a SQL comment recording that this is deliberate, not an oversight.
- `REVOKE ALL ... FROM anon` on all three tables; keep the `authenticated` and `service_role` grants that the app actually needs.
- `REVOKE EXECUTE ... FROM PUBLIC, anon, authenticated` on `handle_new_user` and the three trigger functions (triggers fire as table owner, so this costs nothing).
- Confirm `search_path` stays pinned on every function (already the case).

### 2. Server-side input validation

Replace the pass-through validators in `src/lib/accounts.functions.ts` and `src/lib/profile.functions.ts` with Zod schemas:

- Trimmed, length-capped strings (account name, CSM, notes, profile fields).
- `health_score`, `nps`, `csat` clamped to their valid ranges; ticket counts and `arr_cents` non-negative integers.
- UUID validation on all `id` parameters.
- Enum validation for `segment`, `usage_level`, `plan_tier`, `industry`, `company_size`, `job_title`.
- A row cap on the CSV bulk import so a huge upload can't be used to exhaust the database.

### 3. Verify, don't assume

- Re-run the database linter and the security scan.
- Query privileges again to confirm `anon` has no table access.
- Run an anonymous read against each table and confirm it's rejected rather than silently empty.
- Sign-in smoke test so the tightened policies don't break normal use.

### 4. Record the posture

Write the security memory: single-user app, all data owner-scoped, nothing public, status history intentionally immutable, roles intentionally absent.

## Technical notes

No table, column, or client behaviour changes — this is a policy/grant/validation pass only. The `TO authenticated` change is a strict tightening: signed-in behaviour is identical, anonymous access moves from "allowed but returns nothing" to "denied at the grant level".
