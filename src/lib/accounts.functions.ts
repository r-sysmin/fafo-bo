import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  accountInputSchema,
  bulkAccountsInput,
  idInput,
  onlyProvided,
  updateAccountInput,
} from "./validation";

export type AccountInput = {
  name: string;
  arr_cents?: number;
  plan_tier?: string | null;
  csm_name?: string | null;
  renewal_date?: string | null;
  health_score?: number;
  usage_level?: string | null;
  support_tickets_30d?: number;
  support_tickets_90d?: number;
  nps?: number | null;
  csat?: number | null;
  last_contact_date?: string | null;
  segment?: string | null;
  notes?: string | null;
};

export const listAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("accounts")
      .select("*")
      .eq("user_id", context.userId)
      .order("health_score", { ascending: true });
    if (error) {
      console.error("[accounts.list]", error);
      throw new Error("Could not load your accounts.");
    }
    return data ?? [];
  });

export const getAccount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => idInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("accounts")
      .select("*")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) {
      console.error("[accounts.get]", error);
      throw new Error("Could not load this account.");
    }
    if (!row) throw new Error("Account not found");
    const { data: history } = await context.supabase
      .from("account_status_history")
      .select("*")
      .eq("account_id", data.id)
      .eq("user_id", context.userId)
      .order("changed_at", { ascending: false })
      .limit(20);
    return { account: row, history: history ?? [] };
  });

export const createAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: AccountInput) => accountInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    // user_id always comes from the verified session, never from client input.
    const { data: row, error } = await context.supabase
      .from("accounts")
      .insert({ ...data, user_id: context.userId })
      .select()
      .single();
    if (error) {
      console.error("[accounts.create]", error);
      throw new Error("Could not create this account.");
    }
    return row;
  });

export const updateAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; patch: AccountInput }) => {
    const parsed = updateAccountInput.parse(input);
    const rawPatch = ((input?.patch ?? {}) as Record<string, unknown>);
    // Only write back the fields the caller actually sent.
    return { id: parsed.id, patch: onlyProvided(parsed.patch, rawPatch) };
  })
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("accounts")
      .update(data.patch)
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .select()
      .single();
    if (error) {
      console.error("[accounts.update]", error);
      throw new Error("Could not save this account.");
    }
    return row;
  });

export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => idInput.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("accounts")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) {
      console.error("[accounts.delete]", error);
      throw new Error("Could not delete this account.");
    }
    return { ok: true };
  });

export const bulkInsertAccounts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { rows: AccountInput[] }) => bulkAccountsInput.parse(input))
  .handler(async ({ data, context }) => {
    // Rows are already trimmed, clamped and type-coerced by the schema; drop
    // any row that lost its required name.
    const rows = data.rows
      .filter((r): r is typeof r & { name: string } => Boolean(r.name?.trim()))
      .map((r) => ({ ...r, user_id: context.userId }));
    if (rows.length === 0) return { inserted: 0 };

    const { error, count } = await context.supabase
      .from("accounts")
      .insert(rows, { count: "exact" });
    if (error) {
      console.error("[accounts.bulkInsert]", error);
      throw new Error("Could not import these accounts.");
    }
    return { inserted: count ?? rows.length };
  });


export const clearAccounts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("accounts")
      .delete()
      .eq("user_id", context.userId);
    if (error) {
      console.error("[accounts.clear]", error);
      throw new Error("Could not clear your accounts.");
    }
    return { ok: true };
  });

const SAMPLE_NAMES = [
  "Acme Corp", "Northwind", "Globex", "Umbrella Health", "Initech",
  "Pied Piper", "Hooli", "Massive Dynamic", "Stark Industries", "Vandelay",
  "Wonka Confections", "Soylent Foods", "Cyberdyne", "Tyrell Robotics", "Aperture Science",
];
const CSMS = ["Ana Ruiz", "Ben Cho", "Priya Shah", "Diego Alvarez", "Sara Kim"];
const TIERS = ["Starter", "Growth", "Enterprise"];
const SEGS = ["Enterprise", "Mid-Market", "SMB"];
const USAGE = ["High", "Medium", "Low"];

function rand<T>(a: T[]) { return a[Math.floor(Math.random() * a.length)]; }
function ri(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }

export const seedSampleAccounts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const today = new Date();
    const rows = SAMPLE_NAMES.map((name, i) => {
      const health = ri(15, 95);
      const renewal = new Date(today);
      renewal.setDate(renewal.getDate() + ri(-10, 180));
      const lastContact = new Date(today);
      lastContact.setDate(lastContact.getDate() - ri(1, 60));
      const seg = SEGS[i % SEGS.length];
      const arr = seg === "Enterprise" ? ri(150_000, 900_000) : seg === "Mid-Market" ? ri(30_000, 150_000) : ri(5_000, 30_000);
      return {
        user_id: context.userId,
        name,
        arr_cents: arr * 100,
        plan_tier: rand(TIERS),
        csm_name: rand(CSMS),
        renewal_date: renewal.toISOString().slice(0, 10),
        health_score: health,
        usage_level: rand(USAGE),
        support_tickets_30d: ri(0, 12),
        support_tickets_90d: ri(0, 40),
        nps: ri(-20, 70),
        csat: ri(2, 5),
        last_contact_date: lastContact.toISOString().slice(0, 10),
        segment: seg,
        notes: null,
      };
    });
    const { error } = await context.supabase.from("accounts").insert(rows);
    if (error) {
      console.error("[accounts.seed]", error);
      throw new Error("Could not create sample accounts.");
    }
    return { inserted: rows.length };
  });
