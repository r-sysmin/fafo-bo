import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { onlyProvided, profileUpdateSchema } from "./validation";

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) {
      console.error("[profile.get]", error);
      throw new Error("Could not load your profile.");
    }
    return data;
  });

export type ProfileUpdate = {
  full_name?: string | null;
  job_title?: string | null;
  company_name?: string | null;
  industry?: string | null;
  company_size?: string | null;
  onboarding_step?: number;
  onboarding_completed?: boolean;
};

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: ProfileUpdate) => {
    const raw = (input ?? {}) as Record<string, unknown>;
    // Validate, then keep only the keys the caller actually sent so a
    // step-by-step onboarding save can't blank out unrelated fields.
    return onlyProvided(profileUpdateSchema.parse(raw), raw);
  })
  .handler(async ({ data, context }) => {
    // id always comes from the verified session, never from client input.
    const { data: row, error } = await context.supabase
      .from("profiles")
      .upsert({ ...data, id: context.userId }, { onConflict: "id" })
      .select()
      .single();
    if (error) {
      console.error("[profile.update]", error);
      throw new Error("Could not save your profile.");
    }
    return row;
  });
