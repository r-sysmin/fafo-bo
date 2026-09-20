import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Activity } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/auth/reset")({
  component: ResetPage,
  head: () => ({
    meta: [
      { title: "Set a new password — Pulsecheck" },
      { name: "description", content: "Choose a new password for your Pulsecheck account." },
      { property: "og:title", content: "Set a new password — Pulsecheck" },
      { property: "og:description", content: "Choose a new password for your Pulsecheck account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const passwordSchema = z.string().min(8).max(72);

function ResetPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const pp = passwordSchema.safeParse(password);
    if (!pp.success) {
      toast.error("Password must be 8–72 characters");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pp.data });
      if (error) throw error;
      toast.success("Password updated");
      navigate({ to: "/dashboard", replace: true });
    } catch {
      toast.error("Could not update your password. Open the reset link again and retry.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-4 py-8 sm:px-6 sm:py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2 font-display text-lg font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground"><Activity className="h-4 w-4" /></span>
          Pulsecheck
        </Link>
        <div className="glass p-5 sm:p-8">
          <h1 className="font-display text-xl font-semibold sm:text-2xl">Set a new password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a new password for your Pulsecheck workspace.
          </p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="reset-password" className="mb-1 block text-xs font-medium text-foreground/70">New password</label>
              <input
                id="reset-password" name="password" type="password" required autoComplete="new-password"
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-input bg-white/70 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button type="submit" disabled={busy} className="mt-2 min-h-12 w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-60">
              {busy ? "Please wait…" : "Update password"}
            </button>
          </form>
          <div className="mt-5 text-center text-sm text-muted-foreground">
            <Link to="/auth" className="font-medium text-primary hover:underline">Back to sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
