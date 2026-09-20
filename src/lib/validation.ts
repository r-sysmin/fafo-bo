import { z } from "zod";
import {
  COMPANY_SIZES,
  INDUSTRIES,
  JOB_TITLES,
  SEGMENTS,
  USAGE_LEVELS,
} from "./constants";

/**
 * Server-side input schemas. These run inside `createServerFn` validators, so
 * they are the authoritative boundary — client-side form state is a convenience
 * only and is never trusted.
 */

/** Trimmed free text, capped at `max` chars; empty/absent collapses to null. */
const text = (max: number) =>
  z
    .any()
    .transform((v): string | null => {
      if (v === null || v === undefined) return null;
      const s = String(v).trim().slice(0, max);
      return s === "" ? null : s;
    })
    .optional();

/** Coerces a value to one of `allowed` (case-insensitive), else null. */
const oneOfOrNull = (allowed: readonly string[]) =>
  z
    .any()
    .transform((v): string | null => {
      if (v === null || v === undefined) return null;
      const s = String(v).trim();
      return allowed.find((a) => a.toLowerCase() === s.toLowerCase()) ?? null;
    })
    .optional();

function clampNumber(v: unknown, min: number, max: number): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number.parseFloat(String(v));
  if (!Number.isFinite(n)) return null;
  return Math.min(max, Math.max(min, Math.round(n)));
}

/**
 * Clamps a numeric-ish input into [min, max] for a NOT NULL column.
 * Missing or unparseable values fall back to `fallback`, never null.
 */
const requiredInt = (min: number, max: number, fallback: number) =>
  z
    .any()
    .transform((v): number => clampNumber(v, min, max) ?? fallback)
    .optional();

/** Clamps a numeric-ish input into [min, max] for a nullable column. */
const nullableInt = (min: number, max: number) =>
  z
    .any()
    .transform((v): number | null => clampNumber(v, min, max))
    .optional();

/** ISO calendar date (YYYY-MM-DD); anything else becomes null. */
const isoDate = z
  .any()
  .transform((v): string | null => {
    if (v === null || v === undefined || v === "") return null;
    const s = String(v).trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
    return Number.isNaN(new Date(s).getTime()) ? null : s;
  })
  .optional();


export const uuid = z.string().uuid();
export const idInput = z.object({ id: uuid });

const MAX_ARR_CENTS = 1_000_000_000_00; // $1B

export const accountInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  arr_cents: requiredInt(0, MAX_ARR_CENTS, 0),
  plan_tier: text(80),
  csm_name: text(120),
  renewal_date: isoDate,
  health_score: requiredInt(0, 100, 70),
  usage_level: oneOfOrNull(USAGE_LEVELS),
  support_tickets_30d: requiredInt(0, 100_000, 0),
  support_tickets_90d: requiredInt(0, 100_000, 0),
  nps: nullableInt(-100, 100),
  csat: nullableInt(0, 5),
  last_contact_date: isoDate,
  segment: oneOfOrNull(SEGMENTS),
  notes: text(5000),
});


/** Partial variant for edits — only supplied fields are validated/updated. */
export const accountPatchSchema = accountInputSchema.partial();

export const updateAccountInput = z.object({
  id: uuid,
  patch: accountPatchSchema,
});

/** Guards against a single upload trying to exhaust the database. */
export const MAX_IMPORT_ROWS = 5000;

export const bulkAccountsInput = z.object({
  rows: z.array(accountInputSchema.partial({ name: true })).max(MAX_IMPORT_ROWS),
});

export const profileUpdateSchema = z.object({
  full_name: text(120),
  job_title: oneOfOrNull(JOB_TITLES),
  company_name: text(160),
  industry: oneOfOrNull(INDUSTRIES),
  company_size: oneOfOrNull(COMPANY_SIZES),
  onboarding_step: z.number().int().min(0).max(3).optional(),
  onboarding_completed: z.boolean().optional(),
});

/** Strips keys the caller didn't send so a partial save can't null other fields. */
export function onlyProvided<T extends Record<string, unknown>>(
  parsed: T,
  raw: Record<string, unknown>,
): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(parsed)) {
    if (key in raw) out[key] = parsed[key];
  }
  return out as Partial<T>;
}
