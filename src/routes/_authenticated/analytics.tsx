import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAccounts } from "@/lib/accounts.functions";
import { formatCurrency } from "@/lib/constants";
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/_authenticated/analytics")({ component: Analytics });

function Analytics() {
  const fetchAccounts = useServerFn(listAccounts);
  const { data: accounts = [] } = useQuery({ queryKey: ["accounts"], queryFn: () => fetchAccounts() });

  const dist = [
    { range: "0-19", count: 0 }, { range: "20-39", count: 0 },
    { range: "40-59", count: 0 }, { range: "60-79", count: 0 }, { range: "80-100", count: 0 },
  ];
  accounts.forEach((a) => {
    const s = a.health_score ?? 0;
    const i = s >= 80 ? 4 : s >= 60 ? 3 : s >= 40 ? 2 : s >= 20 ? 1 : 0;
    dist[i].count++;
  });

  const bySeg = new Map<string, { count: number; arr: number }>();
  accounts.forEach((a) => {
    const k = a.segment ?? "Unspecified";
    const cur = bySeg.get(k) ?? { count: 0, arr: 0 };
    cur.count++; cur.arr += a.arr_cents ?? 0;
    bySeg.set(k, cur);
  });
  const segData = Array.from(bySeg, ([name, v]) => ({ name, count: v.count, arr: Math.round(v.arr / 100) }));

  const statusColors: Record<string, string> = { Healthy: "var(--healthy)", "At Risk": "var(--atrisk)", Critical: "var(--critical)" };
  const statusData = (["Healthy", "At Risk", "Critical"] as const).map((s) => ({
    name: s,
    value: accounts.filter((a) => a.status === s).length,
    arr: accounts.filter((a) => a.status === s).reduce((sum, a) => sum + (a.arr_cents ?? 0), 0),
  }));

  const arrAtRisk = statusData[1].arr + statusData[2].arr;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl lg:text-4xl">Analytics</h1>
        <p className="text-sm text-muted-foreground">Snapshot of your portfolio's health.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        <KPI label="Accounts" value={accounts.length.toString()} />
        <KPI label="ARR at risk" value={formatCurrency(arrAtRisk)} />
        <KPI label="Median score" value={median(accounts.map((a) => a.health_score ?? 0)).toString()} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass p-4 sm:p-5">
          <div className="mb-3 text-sm font-semibold">Health score distribution</div>
          <div className="h-56 sm:h-64">
            <ResponsiveContainer>
              <BarChart data={dist}>
                <CartesianGrid stroke="rgba(0,0,0,0.06)" vertical={false} />
                <XAxis dataKey="range" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }} />
                <Bar dataKey="count" fill="var(--teal)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass p-4 sm:p-5">
          <div className="mb-3 text-sm font-semibold">Status split</div>
          {/* Chart is decorative: the same numbers are listed below for screen readers. */}
          <div className="h-56 sm:h-64" role="img" aria-label={`Status split: ${statusData.map((s) => `${s.name} ${s.value}`).join(", ")}`}>
            <ResponsiveContainer>
              <PieChart tabIndex={-1}>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                  {statusData.map((s) => <Cell key={s.name} fill={statusColors[s.name]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 space-y-1 text-sm">
            {statusData.map((s) => (
              <li key={s.name} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: statusColors[s.name] }} />
                  {s.name}
                </span>
                <span className="font-medium">{s.value}</span>
              </li>
            ))}
          </ul>

        </div>

        <div className="glass p-4 sm:p-5 lg:col-span-2">
          <div className="mb-3 text-sm font-semibold">ARR by segment</div>
          <div className="h-56 sm:h-64">
            <ResponsiveContainer>
              <BarChart data={segData}>
                <CartesianGrid stroke="rgba(0,0,0,0.06)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }} formatter={(v: number) => `$${v.toLocaleString()}`} />
                <Bar dataKey="arr" fill="var(--teal)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPI({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass p-4 sm:p-5">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-2 font-display text-2xl font-bold sm:text-3xl lg:text-4xl">{value}</div>
    </div>
  );
}

function median(nums: number[]) {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}
