import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAccount, updateAccount, deleteAccount, type AccountInput } from "@/lib/accounts.functions";
import { StatusBadge, ScorePill } from "@/components/AppShell";
import { formatCurrency, SEGMENTS, USAGE_LEVELS, statusFromScore } from "@/lib/constants";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/accounts/$id")({
  component: AccountDetail,
});

function AccountDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const fetchAccount = useServerFn(getAccount);
  const updateFn = useServerFn(updateAccount);
  const deleteFn = useServerFn(deleteAccount);

  const { data, isLoading, error } = useQuery({
    queryKey: ["account", id],
    queryFn: () => fetchAccount({ data: { id } }),
  });

  const [form, setForm] = useState<AccountInput | null>(null);
  useEffect(() => {
    if (data?.account) {
      const a = data.account;
      setForm({
        name: a.name,
        arr_cents: a.arr_cents ?? 0,
        plan_tier: a.plan_tier,
        csm_name: a.csm_name,
        renewal_date: a.renewal_date,
        health_score: a.health_score ?? 70,
        usage_level: a.usage_level,
        support_tickets_30d: a.support_tickets_30d ?? 0,
        support_tickets_90d: a.support_tickets_90d ?? 0,
        nps: a.nps,
        csat: a.csat,
        last_contact_date: a.last_contact_date,
        segment: a.segment,
        notes: a.notes,
      });
    }
  }, [data]);

  const save = useMutation({
    mutationFn: (patch: AccountInput) => updateFn({ data: { id, patch } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["account", id] }); qc.invalidateQueries({ queryKey: ["accounts"] }); toast.success("Saved"); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  const remove = useMutation({
    mutationFn: () => deleteFn({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["accounts"] }); navigate({ to: "/accounts" }); },
  });

  if (isLoading || !form || !data) return <div className="glass p-6 text-sm text-muted-foreground">Loading…</div>;
  if (error) return <div className="glass p-6 text-sm text-critical">Failed to load account.</div>;

  const status = statusFromScore(form.health_score ?? 0);
  const arrDollars = ((form.arr_cents ?? 0) / 100).toString();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/accounts" className="inline-flex min-h-11 items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> All accounts</Link>
        <button onClick={() => { if (confirm(`Delete ${form.name}?`)) remove.mutate(); }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-white/50 px-4 py-2.5 text-sm text-critical hover:bg-critical/10">
          <Trash2 className="h-4 w-4" /> Delete
        </button>
      </div>

      <div className="glass p-4 sm:p-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:gap-4">
          <div className="min-w-0">
            <h1 className="truncate font-display text-xl font-bold sm:text-2xl lg:text-3xl">{form.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{form.segment ?? "—"} · {formatCurrency(form.arr_cents ?? 0)} ARR · CSM {form.csm_name ?? "—"}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <div className="font-display text-3xl font-black sm:text-4xl"><ScorePill score={form.health_score ?? 0} /></div>
            <StatusBadge status={status} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass space-y-3 p-4 sm:p-5 lg:col-span-2">
          <div className="text-sm font-semibold">Details</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <F label="Account name"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={I} /></F>
            <F label="ARR (USD)"><input type="number" value={arrDollars} onChange={(e) => setForm({ ...form, arr_cents: Math.round(parseFloat(e.target.value || "0") * 100) })} className={I} /></F>
            <F label="Plan tier"><input value={form.plan_tier ?? ""} onChange={(e) => setForm({ ...form, plan_tier: e.target.value })} className={I} /></F>
            <F label="CSM / Owner"><input value={form.csm_name ?? ""} onChange={(e) => setForm({ ...form, csm_name: e.target.value })} className={I} /></F>
            <F label="Renewal date"><input type="date" value={form.renewal_date ?? ""} onChange={(e) => setForm({ ...form, renewal_date: e.target.value })} className={I} /></F>
            <F label="Last contact"><input type="date" value={form.last_contact_date ?? ""} onChange={(e) => setForm({ ...form, last_contact_date: e.target.value })} className={I} /></F>
            <F label="Segment">
              <select value={form.segment ?? ""} onChange={(e) => setForm({ ...form, segment: e.target.value })} className={I}>
                <option value="">—</option>
                {SEGMENTS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </F>
            <F label="Usage level">
              <select value={form.usage_level ?? ""} onChange={(e) => setForm({ ...form, usage_level: e.target.value })} className={I}>
                <option value="">—</option>
                {USAGE_LEVELS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </F>
          </div>
          <F label="Notes">
            <textarea rows={4} value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={I} />
          </F>
          <div className="flex justify-stretch sm:justify-end">
            <button onClick={() => save.mutate(form)} disabled={save.isPending} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 sm:w-auto">
              <Save className="h-4 w-4" /> Save changes
            </button>
          </div>
        </div>

        <div className="glass space-y-4 p-4 sm:p-5">
          <div className="text-sm font-semibold">Health inputs</div>
          <F label={`Score (${form.health_score ?? 0})`}>
            <input type="range" min={0} max={100} value={form.health_score ?? 0} onChange={(e) => setForm({ ...form, health_score: parseInt(e.target.value, 10) })} className="w-full accent-primary" />
          </F>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <F label="Tickets 30d"><input type="number" value={form.support_tickets_30d ?? 0} onChange={(e) => setForm({ ...form, support_tickets_30d: parseInt(e.target.value, 10) || 0 })} className={I} /></F>
            <F label="Tickets 90d"><input type="number" value={form.support_tickets_90d ?? 0} onChange={(e) => setForm({ ...form, support_tickets_90d: parseInt(e.target.value, 10) || 0 })} className={I} /></F>
            <F label="NPS"><input type="number" value={form.nps ?? ""} onChange={(e) => setForm({ ...form, nps: e.target.value === "" ? null : parseInt(e.target.value, 10) })} className={I} /></F>
            <F label="CSAT"><input type="number" value={form.csat ?? ""} onChange={(e) => setForm({ ...form, csat: e.target.value === "" ? null : parseInt(e.target.value, 10) })} className={I} /></F>
          </div>
        </div>
      </div>

      <div className="glass p-5">
        <div className="mb-3 text-sm font-semibold">Status history</div>
        {data.history.length === 0 ? (
          <div className="text-sm text-muted-foreground">No status changes recorded yet.</div>
        ) : (
          <ul className="divide-y divide-border/60 text-sm">
            {data.history.map((h) => (
              <li key={h.id} className="flex items-center justify-between py-2">
                <span>
                  <StatusBadge status={h.old_status ?? "—"} /> <span className="mx-1 text-muted-foreground">→</span> <StatusBadge status={h.new_status} />
                </span>
                <span className="text-xs text-muted-foreground">{new Date(h.changed_at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

const I = "w-full rounded-lg border border-input bg-white/70 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary";
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block text-xs font-medium text-foreground/70">{label}</span>{children}</label>;
}
