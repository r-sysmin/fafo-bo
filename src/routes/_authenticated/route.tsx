import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { getProfile } from "@/lib/profile.functions";
import { Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = Route.useRouteContext();
  const fetchProfile = useServerFn(getProfile);
  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ["profile"],
    queryFn: () => fetchProfile(),
    enabled: Boolean(user?.id),
    retry: false,
  });

  const onOnboarding = pathname.startsWith("/onboarding");

  if (isError) {
    return <Navigate to="/auth" replace />;
  }

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="glass px-6 py-4 text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }


  if (profile && !profile.onboarding_completed && !onOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }
  if (profile?.onboarding_completed && onOnboarding) {
    return <Navigate to="/dashboard" replace />;
  }

  if (onOnboarding) return <Outlet />;
  return <AppShell><Outlet /></AppShell>;
}
