import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Activity } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in to Pulsecheck — Account health dashboard" },
      { name: "description", content: "Sign in or create your Pulsecheck account to track customer health scores, renewals and churn risk." },
      { property: "og:title", content: "Sign in to Pulsecheck" },
      { property: "og:description", content: "Track customer health scores, renewals and churn risk in one dashboard." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://pulse-forward-health.lovable.app/auth" },
      { property: "og:image", content: "https://pulse-forward-health.lovable.app/og-image.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://pulse-forward-health.lovable.app/og-image.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://pulse-forward-health.lovable.app/auth" }],
  }),
  component: AuthPage,
});


const emailSchema = z.string().trim().email().max(255);
const passwordSchema = z.string().min(8).max(72);

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);


  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    const ep = emailSchema.safeParse(email);
    const pp = passwordSchema.safeParse(password);
    if (!ep.success) { toast.error("Enter a valid email"); return; }
    if (!pp.success) { toast.error("Password must be 8–72 characters"); return; }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: ep.data, password: pp.data,
          options: { emailRedirectTo: `${window.location.origin}/dashboard` },
        });
        // Never surface the sign-up error: distinct messages would reveal
        // whether an address is already registered. Always show the same
        // neutral confirmation screen.
        if (error || !data.session) {
          if (error) console.error("[auth.signup]", error);
          setConfirmSent(true);
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: ep.data, password: pp.data });
        if (error) throw error;
      }
      navigate({ to: "/dashboard", replace: true });

    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function handleForgotPassword() {
    const ep = emailSchema.safeParse(email);
    if (!ep.success) { toast.error("Enter your email address first"); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(ep.data, {
        redirectTo: `${window.location.origin}/auth/reset`,
      });
      if (error) console.error("[auth.reset]", error);
    } catch (err) {
      console.error("[auth.reset]", err);
    } finally {
      setBusy(false);
      // Neutral either way so the form can't be used to probe for accounts.
      toast.success("If that address has an account, we've sent a reset link.");
    }
  }

  async function handleGoogle() {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) { toast.error("Google sign-in failed"); setBusy(false); return; }
      if (result.redirected) return;
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
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
        {confirmSent ? (
          <div className="glass p-5 sm:p-8">
            <h1 className="font-display text-xl font-semibold sm:text-2xl">Confirm your email</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              If that address is new, we've sent you a confirmation link — check your inbox.
            </p>
            <button
              onClick={() => { setConfirmSent(false); setMode("signin"); setPassword(""); }}
              className="mt-6 min-h-12 w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
            >
              Back to sign in
            </button>
          </div>
        ) : (
        <div className="glass p-5 sm:p-8">
          <h1 className="font-display text-xl font-semibold sm:text-2xl">{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin" ? "Sign in to your Pulsecheck workspace." : "Start seeing account risk in minutes."}
          </p>


          <button
            onClick={handleGoogle}
            disabled={busy}
            className="mt-6 flex min-h-12 w-full items-center justify-center gap-3 rounded-lg border border-border bg-white/70 px-4 py-3 text-sm font-medium hover:bg-white disabled:opacity-60"
          >
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.5-.2-2.2H12v4.3h5.9c-.3 1.4-1 2.6-2.2 3.4v2.8h3.6c2.1-1.9 3.2-4.7 3.2-8.3z"/><path fill="#34A853" d="M12 23c2.9 0 5.4-1 7.2-2.6l-3.6-2.8c-1 .7-2.3 1.1-3.6 1.1-2.8 0-5.1-1.9-6-4.4H2.2v2.8C4 20.5 7.7 23 12 23z"/><path fill="#FBBC05" d="M6 14.3c-.2-.6-.3-1.3-.3-2.3s.1-1.6.3-2.3V6.9H2.2C1.4 8.4 1 10.1 1 12s.4 3.6 1.2 5.1L6 14.3z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3 .5 4.1 1.6l3.1-3.1C17.4 2.1 14.9 1 12 1 7.7 1 4 3.5 2.2 6.9L6 9.7C6.9 7.3 9.2 5.4 12 5.4z"/></svg>
            Continue with Google
          </button>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleEmail} className="space-y-4">
            <div>
              <label htmlFor="auth-email" className="mb-1 block text-xs font-medium text-foreground/70">Email</label>
              <input id="auth-email" name="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-input bg-white/70 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between gap-2">
                <label htmlFor="auth-password" className="block text-xs font-medium text-foreground/70">Password</label>
                {mode === "signin" && (
                  <button type="button" onClick={handleForgotPassword} disabled={busy} className="text-xs font-medium text-primary hover:underline disabled:opacity-60">
                    Forgot password?
                  </button>
                )}
              </div>
              <input id="auth-password" name="password" type="password" required autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-input bg-white/70 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>

            <button type="submit" disabled={busy} className="mt-2 min-h-12 w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-60">
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-muted-foreground">
            {mode === "signin" ? (
              <>New to Pulsecheck? <button className="min-h-11 font-medium text-primary hover:underline" onClick={() => setMode("signup")}>Create an account</button></>
            ) : (
              <>Already have an account? <button className="min-h-11 font-medium text-primary hover:underline" onClick={() => setMode("signin")}>Sign in</button></>
            )}
          </div>
        </div>
        )}

      </div>
    </div>
  );
}
