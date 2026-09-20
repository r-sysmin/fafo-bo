import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAccounts } from "@/lib/accounts.functions";
import { StatusBadge, ScorePill } from "@/components/AppShell";
import { formatCurrency } from "@/lib/constants";
import { AlertTriangle, TrendingUp, Users, Calendar } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const fetchAccounts = useServerFn(listAccounts);
  const { data: accounts = [] } = useQuery({ queryKey: ["accounts"], queryFn: () => fetchAccounts() });

  const byStatus = accounts.reduce<Record<string, { count: number; arr: number }>>(
    (acc, a) => {
      const s = a.status ?? "Healthy";
      acc[s] ??= { count: 0, arr: 0 };
      acc[s].count += 1;
      acc[s].arr += a.arr_cents ?? 0;
      return acc;
    },
    {},
  );
  const totalArr = accounts.reduce((s, a) => s + (a.arr_cents ?? 0), 0);
  const risky = [...accounts].sort((a, b) => (a.health_score ?? 0) - (b.health_score ?? 0)).slice(0, 6);

  const now = new Date();
  const inDays = (d: string | null) => d ? Math.floor((new Date(d).getTime() - now.getTime()) / 86400000) : 999;
  const upcoming = accounts.filter((a) => a.renewal_date && inDays(a.renewal_date) >= 0 && inDays(a.renewal_date) <= 90)
    .sort((a, b) => inDays(a.renewal_date) - inDays(b.renewal_date));
  const bucket = (min: number, max: number) => upcoming.filter((a) => { const d = inDays(a.renewal_date); return d >= min && d <= max; });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1 px-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl lg:text-4xl">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Where your book stands right now.</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Users} label="Total accounts" value={accounts.length.toString()} />
        <Stat icon={TrendingUp} label="Total ARR" value={formatCurrency(totalArr)} />
        <Stat icon={AlertTriangle} label="ARR at risk" tone="text-atrisk" value={formatCurrency((byStatus["At Risk"]?.arr ?? 0) + (byStatus["Critical"]?.arr ?? 0))} />
        <Stat icon={Calendar} label="Renewals in 30 days" value={bucket(0, 30).length.toString()} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass p-4 sm:p-5 lg:col-span-1">
          <div className="mb-4 text-sm font-semibold">Status breakdown</div>
          <div className="space-y-3">
            {(["Healthy", "At Risk", "Critical"] as const).map((s) => {
              const b = byStatus[s] ?? { count: 0, arr: 0 };
              const pct = accounts.length ? Math.round((b.count / accounts.length) * 100) : 0;
              const color = s === "Healthy" ? "bg-healthy" : s === "At Risk" ? "bg-atrisk" : "bg-critical";
              return (
                <div key={s}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium">{s}</span>
                    <span className="text-muted-foreground">{b.count} · {formatCurrency(b.arr)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/60">
                    <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass p-4 sm:p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm font-semibold">Highest-risk accounts</div>
            <Link to="/accounts" className="text-xs font-medium text-primary hover:underline">View all</Link>
          </div>
          {risky.length === 0 ? (
            <EmptyHint />
          ) : (
            <div className="divide-y divide-border/60">
              {risky.map((a) => (
                <Link to="/accounts/$id" params={{ id: a.id }} key={a.id} className="flex min-h-11 flex-col gap-2 rounded-lg px-1 py-3 hover:bg-white/40 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{a.name}</div>
                    <div className="text-xs text-muted-foreground">{a.segment ?? "—"} · {formatCurrency(a.arr_cents)} · CSM: {a.csm_name ?? "—"}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 sm:justify-end">
                    <ScorePill score={a.health_score ?? 0} />
                    <StatusBadge status={a.status ?? "Healthy"} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="glass p-4 sm:p-5">
        <div className="mb-4 text-sm font-semibold">Upcoming renewals</div>
        <div className="grid gap-3 sm:grid-cols-3">
          {([["0–30 days", bucket(0, 30)], ["31–60 days", bucket(31, 60)], ["61–90 days", bucket(61, 90)]] as const).map(([label, list]) => (
            <div key={label} className="glass-subtle p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
              <div className="mt-1 font-display text-2xl font-bold">{list.length}</div>
              <div className="mt-1 text-xs text-muted-foreground">{formatCurrency(list.reduce((s, a) => s + (a.arr_cents ?? 0), 0))} ARR</div>
              <div className="mt-3 space-y-1 text-xs">
                {list.slice(0, 3).map((a) => (
                  <div key={a.id} className="flex justify-between"><span className="truncate">{a.name}</span><span className="text-muted-foreground">{a.renewal_date}</span></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, tone }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; tone?: string }) {
  return (
    <div className="glass p-4 sm:p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className={`mt-2 font-display text-2xl font-bold sm:text-3xl ${tone ?? ""}`}>{value}</div>
    </div>
  );
}

function EmptyHint() {
  return (
    <div className="rounded-lg bg-white/50 p-4 text-sm text-muted-foreground">
      No accounts yet. <Link to="/accounts" className="text-primary hover:underline">Add one</Link> or <Link to="/import" className="text-primary hover:underline">import a CSV</Link>.
    </div>
  );
}
