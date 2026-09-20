import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAccounts, createAccount, deleteAccount, type AccountInput } from "@/lib/accounts.functions";
import { StatusBadge, ScorePill } from "@/components/AppShell";
import { formatCurrency, SEGMENTS, STATUSES } from "@/lib/constants";
import { Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/accounts/")({
  component: AccountsPage,
});

function AccountsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const fetchAccounts = useServerFn(listAccounts);
  const createFn = useServerFn(createAccount);
  const deleteFn = useServerFn(deleteAccount);
  const { data: accounts = [] } = useQuery({ queryKey: ["accounts"], queryFn: () => fetchAccounts() });

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [segment, setSegment] = useState<string>("all");
  const [csm, setCsm] = useState<string>("all");
  const [showAdd, setShowAdd] = useState(false);

  const csms = useMemo(() => Array.from(new Set(accounts.map((a) => a.csm_name).filter(Boolean))) as string[], [accounts]);

  const filtered = accounts.filter((a) => {
    if (q && !a.name.toLowerCase().includes(q.toLowerCase())) return false;
    if (status !== "all" && a.status !== status) return false;
    if (segment !== "all" && a.segment !== segment) return false;
    if (csm !== "all" && a.csm_name !== csm) return false;
    return true;
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["accounts"] }); toast.success("Deleted"); },
  });

  const create = useMutation({
    mutationFn: (input: AccountInput) => createFn({ data: input }),
    onSuccess: (row) => { qc.invalidateQueries({ queryKey: ["accounts"] }); setShowAdd(false); navigate({ to: "/accounts/$id", params: { id: row.id } }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold sm:text-3xl lg:text-4xl">Accounts</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} of {accounts.length} accounts</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 sm:w-auto">
          <Plus className="h-4 w-4" /> Add account
        </button>
      </div>

      <div className="glass p-4">
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-2 lg:grid-cols-[1fr_auto_auto_auto]">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search accounts" placeholder="Search accounts…" className="w-full rounded-lg border border-input bg-white/70 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status" className="w-full rounded-lg border border-input bg-white/70 px-3 py-2 text-sm">
            <option value="all">All statuses</option>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select value={segment} onChange={(e) => setSegment(e.target.value)} aria-label="Filter by segment" className="w-full rounded-lg border border-input bg-white/70 px-3 py-2 text-sm">
            <option value="all">All segments</option>
            {SEGMENTS.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select value={csm} onChange={(e) => setCsm(e.target.value)} aria-label="Filter by CSM" className="w-full rounded-lg border border-input bg-white/70 px-3 py-2 text-sm">
            <option value="all">All CSMs</option>
            {csms.map((s) => <option key={s}>{s}</option>)}
          </select>

        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="glass p-8 text-center text-sm text-muted-foreground">No accounts match your filters.</div>
      ) : (
        <>
          {/* Mobile card list */}
          <div className="grid gap-3 md:hidden">
            {filtered.map((a) => (
              <div key={a.id} className="glass p-4">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                  <Link to="/accounts/$id" params={{ id: a.id }} className="min-w-0">
                    <div className="truncate font-semibold">{a.name}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{a.segment ?? "—"} · {formatCurrency(a.arr_cents)}</div>
                  </Link>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <ScorePill score={a.health_score ?? 0} />
                    <StatusBadge status={a.status ?? "Healthy"} />
                  </div>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div><dt className="text-muted-foreground">CSM</dt><dd className="truncate font-medium">{a.csm_name ?? "—"}</dd></div>
                  <div><dt className="text-muted-foreground">Renewal</dt><dd className="font-medium">{a.renewal_date ?? "—"}</dd></div>
                </dl>
                <div className="mt-3 flex gap-2">
                  <Link to="/accounts/$id" params={{ id: a.id }} className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg border border-border bg-white/60 px-3 text-sm font-medium">
                    View
                  </Link>
                  <button onClick={() => { if (confirm(`Delete ${a.name}?`)) remove.mutate(a.id); }} className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-border bg-white/60 text-muted-foreground active:bg-critical/10 active:text-critical" aria-label={`Delete ${a.name}`}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Table from md up */}
          <div className="glass hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="p-3">Account</th>
                    <th className="p-3">Segment</th>
                    <th className="p-3">ARR</th>
                    <th className="p-3">CSM</th>
                    <th className="p-3">Renewal</th>
                    <th className="p-3">Score</th>
                    <th className="p-3">Status</th>
                    <th className="p-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => (
                    <tr key={a.id} className="border-b border-border/40 last:border-0 hover:bg-white/50">
                      <td className="p-3 font-medium"><Link to="/accounts/$id" params={{ id: a.id }} className="hover:text-primary">{a.name}</Link></td>
                      <td className="p-3 text-muted-foreground">{a.segment ?? "—"}</td>
                      <td className="p-3">{formatCurrency(a.arr_cents)}</td>
                      <td className="p-3 text-muted-foreground">{a.csm_name ?? "—"}</td>
                      <td className="p-3 text-muted-foreground">{a.renewal_date ?? "—"}</td>
                      <td className="p-3"><ScorePill score={a.health_score ?? 0} /></td>
                      <td className="p-3"><StatusBadge status={a.status ?? "Healthy"} /></td>
                      <td className="p-3 text-right">
                        <button onClick={() => { if (confirm(`Delete ${a.name}?`)) remove.mutate(a.id); }} className="grid h-9 w-9 place-items-center rounded text-muted-foreground hover:bg-critical/10 hover:text-critical" aria-label={`Delete ${a.name}`}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {showAdd && <AddDialog onClose={() => setShowAdd(false)} onSubmit={(v) => create.mutate(v)} busy={create.isPending} />}
    </div>
  );
}

function AddDialog({ onClose, onSubmit, busy }: { onClose: () => void; onSubmit: (v: AccountInput) => void; busy: boolean }) {
  const [name, setName] = useState("");
  const [arr, setArr] = useState("");
  const [segment, setSegment] = useState<string>(SEGMENTS[0]);
  const [score, setScore] = useState("70");
  const [csm, setCsm] = useState("");
  const [renewal, setRenewal] = useState("");
  return (
    <div className="fixed inset-0 z-50 grid place-items-end overflow-y-auto bg-black/40 p-3 sm:place-items-center sm:p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="new-account-title" className="glass w-full max-w-md p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="new-account-title" className="font-display text-lg font-semibold">New account</h2>
          <button onClick={onClose} className="grid h-11 w-11 place-items-center rounded-lg hover:bg-white/50" aria-label="Close"><X className="h-5 w-5" /></button>

        </div>
        <div className="space-y-3">
          <Input label="Account name" value={name} onChange={setName} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input label="ARR (USD)" value={arr} onChange={setArr} type="number" />
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-foreground/70">Segment</span>
              <select value={segment} onChange={(e) => setSegment(e.target.value)} className="w-full rounded-lg border border-input bg-white/70 px-3 py-2 text-sm">
                {SEGMENTS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input label="Health score (0-100)" value={score} onChange={setScore} type="number" />
            <Input label="Renewal date" value={renewal} onChange={setRenewal} type="date" />
          </div>
          <Input label="CSM / Owner" value={csm} onChange={setCsm} />
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button onClick={onClose} className="min-h-11 w-full rounded-lg border border-border bg-white/50 px-3 py-2.5 text-sm text-muted-foreground hover:bg-white/70 sm:w-auto sm:border-0 sm:bg-transparent">Cancel</button>
          <button
            disabled={busy || !name.trim()}
            onClick={() => onSubmit({
              name: name.trim(),
              arr_cents: arr ? Math.round(parseFloat(arr) * 100) : undefined,
              segment,
              health_score: parseInt(score, 10) || 70,
              csm_name: csm || null,
              renewal_date: renewal || null,
            })}
            className="min-h-11 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 sm:w-auto"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-foreground/70">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-input bg-white/70 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
    </label>
  );
}
