import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Activity, LayoutDashboard, Users, LineChart, Upload, Download, Settings, LogOut, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/accounts", label: "Accounts", icon: Users },
  { to: "/analytics", label: "Analytics", icon: LineChart },
  { to: "/import", label: "Import", icon: Upload },
  { to: "/export", label: "Export", icon: Download },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const navLink = (active: boolean) => cn(
    "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium transition-colors sm:text-sm",
    active ? "bg-primary text-primary-foreground shadow" : "text-foreground/70 hover:bg-white/50 active:bg-white/70 hover:text-foreground",
  );

  return (
    <div className="min-h-screen lg:flex">
      {/* Desktop sidebar */}
      <aside className="glass sticky top-3 z-40 my-3 ml-3 hidden h-[calc(100vh-1.5rem)] w-60 shrink-0 flex-col p-4 lg:flex">
        <Link to="/dashboard" className="flex items-center gap-2 font-display text-lg font-semibold">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow"><Activity className="h-4 w-4" /></span>
          <span>Pulsecheck</span>
        </Link>
        <nav className="mt-6 flex flex-1 flex-col gap-1">
          {NAV.map((n) => {
            const Icon = n.icon;
            return (
              <Link key={n.to} to={n.to} className={navLink(pathname.startsWith(n.to))}>
                <Icon className="h-4 w-4 shrink-0" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <button onClick={signOut} className="mt-2 flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/70 hover:bg-white/50">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </aside>

      {/* Mobile top bar */}
      <header className="glass sticky top-3 z-40 mx-4 mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:mx-6 lg:hidden">
        <Link to="/dashboard" className="flex min-w-0 items-center gap-2 font-display text-base font-semibold sm:text-lg">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow"><Activity className="h-4 w-4" /></span>
          <span className="truncate">Pulsecheck</span>
        </Link>
        <button
          onClick={() => setOpen(true)}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-border bg-white/60 active:bg-white"
          aria-label="Open menu"
          aria-expanded={open}
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Mobile slide-out drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 h-full w-full bg-black/50 backdrop-blur-sm"
          />
          <nav className="glass absolute inset-y-0 right-0 flex w-[min(20rem,85vw)] flex-col gap-2 rounded-l-2xl rounded-r-none p-4">
            <div className="flex items-center justify-between">
              <span className="font-display text-base font-semibold">Menu</span>
              <button onClick={() => setOpen(false)} className="grid h-11 w-11 place-items-center rounded-lg border border-border bg-white/60" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-2 flex flex-col gap-2">
              {NAV.map((n) => {
                const Icon = n.icon;
                return (
                  <Link key={n.to} to={n.to} className={navLink(pathname.startsWith(n.to))} onClick={() => setOpen(false)}>
                    <Icon className="h-5 w-5 shrink-0" /> {n.label}
                  </Link>
                );
              })}
            </div>
            <button onClick={signOut} className="mt-auto flex min-h-11 w-full items-center gap-3 rounded-lg border border-border bg-white/60 px-3 py-2.5 text-base font-medium text-foreground/80">
              <LogOut className="h-5 w-5" /> Sign out
            </button>
          </nav>
        </div>
      )}

      <main className="mx-4 mt-4 mb-10 min-w-0 flex-1 sm:mx-6 lg:mt-6 lg:mr-8 lg:ml-6">{children}</main>
    </div>
  );
}


export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Healthy: "bg-healthy/15 text-healthy",
    "At Risk": "bg-atrisk/20 text-atrisk",
    Critical: "bg-critical/15 text-critical",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", map[status] ?? "bg-muted text-foreground/70")}>
      {status}
    </span>
  );
}

export function ScorePill({ score }: { score: number }) {
  const color = score >= 70 ? "text-healthy" : score >= 40 ? "text-atrisk" : "text-critical";
  return <span className={cn("font-display font-semibold", color)}>{score}</span>;
}
