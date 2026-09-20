import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getProfile, updateProfile } from "@/lib/profile.functions";
import { clearAccounts } from "@/lib/accounts.functions";
import { INDUSTRIES, COMPANY_SIZES, JOB_TITLES } from "@/lib/constants";
import { Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({ component: Settings });

const TOOLS = [
  { name: "Salesforce", desc: "Sync accounts and opportunities" },
  { name: "HubSpot", desc: "Deals and customer records" },
  { name: "Zendesk", desc: "Support ticket volume" },
  { name: "Gainsight", desc: "Health scores and playbooks" },
];

function Settings() {
  const qc = useQueryClient();
  const fetchProfile = useServerFn(getProfile);
  const saveProfile = useServerFn(updateProfile);
  const clear = useServerFn(clearAccounts);
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => fetchProfile() });

  const [form, setForm] = useState({
    full_name: "", job_title: JOB_TITLES[0] as string,
    company_name: "", industry: INDUSTRIES[0] as string, company_size: COMPANY_SIZES[0] as string,
  });
  useEffect(() => {
    if (profile) setForm({
      full_name: profile.full_name ?? "",
      job_title: profile.job_title ?? JOB_TITLES[0],
      company_name: profile.company_name ?? "",
      industry: profile.industry ?? INDUSTRIES[0],
      company_size: profile.company_size ?? COMPANY_SIZES[0],
    });
  }, [profile]);

  const save = useMutation({
    mutationFn: () => saveProfile({ data: form }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["profile"] }); toast.success("Saved"); },
  });

  const clearAll = useMutation({
    mutationFn: () => clear(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["accounts"] }); toast.success("All accounts cleared"); },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl lg:text-4xl">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your profile and workspace.</p>
      </div>

      <div className="glass space-y-3 p-4 sm:p-6">
        <div className="text-sm font-semibold">Profile</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <F label="Full name"><input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className={I} /></F>
          <F label="Job title">
            <select value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} className={I}>
              {JOB_TITLES.map((j) => <option key={j}>{j}</option>)}
            </select>
          </F>
          <F label="Company"><input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} className={I} /></F>
          <F label="Industry">
            <select value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} className={I}>
              {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
            </select>
          </F>
          <F label="Company size">
            <select value={form.company_size} onChange={(e) => setForm({ ...form, company_size: e.target.value })} className={I}>
              {COMPANY_SIZES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </F>
        </div>
        <div className="flex justify-stretch sm:justify-end">
          <button onClick={() => save.mutate()} disabled={save.isPending} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 sm:w-auto">
            <Save className="h-4 w-4" /> Save
          </button>
        </div>
      </div>

      <div className="glass p-4 sm:p-6">
        <div className="mb-1 flex items-center gap-2 text-sm font-semibold">Connect your tools <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">Coming soon</span></div>
        <p className="text-xs text-muted-foreground">Live connectors aren't part of this template. When they ship, pulling account data becomes one-click.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {TOOLS.map((t) => (
            <div key={t.name} className="glass-subtle flex flex-col items-start gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-semibold">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.desc}</div>
              </div>
              <button disabled className="min-h-11 w-full rounded-lg border border-border bg-white/50 px-3 py-2 text-xs text-muted-foreground sm:min-h-0 sm:w-auto sm:py-1.5">Coming soon</button>
            </div>
          ))}
        </div>
      </div>

      <div className="glass p-4 sm:p-6">
        <div className="mb-2 text-sm font-semibold text-critical">Danger zone</div>
        <p className="text-xs text-muted-foreground">Delete all accounts in your workspace. This cannot be undone.</p>
        <button
          onClick={() => { if (confirm("Delete ALL accounts? This cannot be undone.")) clearAll.mutate(); }}
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-critical/40 bg-white/50 px-4 py-2.5 text-sm text-critical hover:bg-critical/10 sm:w-auto"
        >
          <Trash2 className="h-4 w-4" /> Clear all accounts
        </button>
      </div>
    </div>
  );
}

const I = "w-full rounded-lg border border-input bg-white/70 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary";
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block text-xs font-medium text-foreground/70">{label}</span>{children}</label>;
}
