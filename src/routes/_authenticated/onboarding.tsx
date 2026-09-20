import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getProfile, updateProfile } from "@/lib/profile.functions";
import { seedSampleAccounts, bulkInsertAccounts } from "@/lib/accounts.functions";
import { INDUSTRIES, COMPANY_SIZES, JOB_TITLES } from "@/lib/constants";
import { Activity, ArrowLeft, ArrowRight, Check, Download, Sparkles, Upload, X } from "lucide-react";
import { toast } from "sonner";
import Papa from "papaparse";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: Onboarding,
});

const STEPS = ["Personal", "Company", "Data"] as const;

function Onboarding() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchProfile = useServerFn(getProfile);
  const saveProfile = useServerFn(updateProfile);
  const seed = useServerFn(seedSampleAccounts);
  const bulk = useServerFn(bulkInsertAccounts);

  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => fetchProfile() });

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    full_name: "", job_title: JOB_TITLES[0] as string,
    company_name: "", industry: INDUSTRIES[0] as string, company_size: COMPANY_SIZES[0] as string,
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile) {
      setStep(Math.min(profile.onboarding_step ?? 0, 2));
      setForm({
        full_name: profile.full_name ?? "",
        job_title: profile.job_title ?? JOB_TITLES[0],
        company_name: profile.company_name ?? "",
        industry: profile.industry ?? INDUSTRIES[0],
        company_size: profile.company_size ?? COMPANY_SIZES[0],
      });
    }
  }, [profile]);

  const save = useMutation({
    mutationFn: (patch: Parameters<typeof saveProfile>[0]["data"]) => saveProfile({ data: patch }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });

  async function goNext() {
    setBusy(true);
    try {
      if (step === 0) {
        if (!form.full_name.trim()) { toast.error("Enter your name"); setBusy(false); return; }
        await save.mutateAsync({ full_name: form.full_name, job_title: form.job_title, onboarding_step: 1 });
        setStep(1);
      } else if (step === 1) {
        if (!form.company_name.trim()) { toast.error("Enter your company name"); setBusy(false); return; }
        await save.mutateAsync({ company_name: form.company_name, industry: form.industry, company_size: form.company_size, onboarding_step: 2 });
        setStep(2);
      }
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed to save"); }
    finally { setBusy(false); }
  }

  async function finishWithSample() {
    setBusy(true);
    try {
      await seed();
      await save.mutateAsync({ onboarding_completed: true, onboarding_step: 3 });
      toast.success("Sample accounts loaded");
      navigate({ to: "/dashboard" });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Seed failed"); }
    finally { setBusy(false); }
  }

  async function finishSkipData() {
    setBusy(true);
    try {
      await save.mutateAsync({ onboarding_completed: true, onboarding_step: 3 });
      navigate({ to: "/dashboard" });
    } finally { setBusy(false); }
  }

  async function handleFile(file: File) {
    setBusy(true);
    try {
      const rows = await parseCsv(file);
      const res = await bulk({ data: { rows: rows as never } });
      await save.mutateAsync({ onboarding_completed: true, onboarding_step: 3 });
      toast.success(`Imported ${res.inserted} accounts`);
      navigate({ to: "/dashboard" });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Import failed"); }
    finally { setBusy(false); }
  }

  return (
    <div className="min-h-screen px-4 py-8 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 font-display text-lg font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground"><Activity className="h-4 w-4" /></span>
            Pulsecheck
          </Link>
          <button onClick={finishSkipData} className="inline-flex min-h-11 items-center gap-1 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-white/50">
            <X className="h-4 w-4" /> Exit
          </button>
        </div>

        <div className="glass p-5 sm:p-8">
          {/* Progress */}
          <div className="mb-6 flex items-center gap-2">
            {STEPS.map((label, i) => (
              <div key={label} className="flex flex-1 items-center gap-2">
                <div className={`grid h-7 w-7 place-items-center rounded-full text-xs font-semibold ${i < step ? "bg-primary text-primary-foreground" : i === step ? "bg-primary text-primary-foreground ring-teal" : "bg-white/70 text-muted-foreground"}`}>
                  {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                {i < STEPS.length - 1 && <div className={`h-1 flex-1 rounded-full ${i < step ? "bg-primary" : "bg-white/60"}`} />}
              </div>
            ))}
          </div>
          <div className="mb-6 text-xs uppercase tracking-wide text-muted-foreground">Step {step + 1} of 3 · {STEPS[step]}</div>

          {step === 0 && (
            <div className="space-y-4">
              <h1 className="font-display text-xl font-semibold sm:text-2xl">Tell us about you</h1>
              <Field label="Full name">
                <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Job title">
                <select value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} className={inputCls}>
                  {JOB_TITLES.map((j) => <option key={j}>{j}</option>)}
                </select>
              </Field>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h1 className="font-display text-xl font-semibold sm:text-2xl">About your company</h1>
              <Field label="Company name">
                <input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Industry">
                <select value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} className={inputCls}>
                  {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
                </select>
              </Field>
              <Field label="Company size">
                <select value={form.company_size} onChange={(e) => setForm({ ...form, company_size: e.target.value })} className={inputCls}>
                  {COMPANY_SIZES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h1 className="font-display text-xl font-semibold sm:text-2xl">Bring in your accounts</h1>
              <p className="text-sm text-muted-foreground">You can start with your own CSV, or explore with realistic sample data. You can always add or import more later.</p>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="glass-subtle block cursor-pointer p-4 hover:bg-white/70">
                  <Upload className="h-5 w-5 text-primary" />
                  <div className="mt-2 font-semibold">Import a CSV</div>
                  <p className="mt-1 text-xs text-muted-foreground">Column headers are auto-mapped.</p>
                  <input type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                </label>
                <button onClick={finishWithSample} disabled={busy} className="glass-subtle p-4 text-left hover:bg-white/70 disabled:opacity-60">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <div className="mt-2 font-semibold">Explore with sample data</div>
                  <p className="mt-1 text-xs text-muted-foreground">Loads 15 realistic accounts.</p>
                </button>
              </div>
              <button onClick={downloadTemplate} className="inline-flex min-h-11 items-center gap-2 text-xs text-primary hover:underline">
                <Download className="h-3.5 w-3.5" /> Download CSV template
              </button>
            </div>
          )}

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              onClick={() => (step === 0 ? navigate({ to: "/dashboard" }) : setStep(step - 1))}
              className="inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-lg border border-border bg-white/50 px-3 py-2.5 text-sm text-muted-foreground hover:bg-white/70 sm:w-auto sm:border-0 sm:bg-transparent"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
              {step < 2 && (
                <button onClick={finishSkipData} className="min-h-11 w-full rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-white/50 sm:w-auto">Skip</button>
              )}
              {step < 2 ? (
                <button onClick={goNext} disabled={busy} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 sm:w-auto">
                  Continue <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button onClick={finishSkipData} disabled={busy} className="min-h-11 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 sm:w-auto">
                  Skip and finish
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputCls = "w-full rounded-lg border border-input bg-white/70 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block text-xs font-medium text-foreground/70">{label}</span>{children}</label>;
}

const CSV_TEMPLATE = "name,arr,plan_tier,csm,renewal_date,health_score,usage_level,support_tickets_30d,support_tickets_90d,nps,csat,last_contact_date,segment,notes\nAcme Corp,120000,Growth,Ana Ruiz,2026-06-15,72,High,2,7,45,4,2026-05-01,Mid-Market,Renewal on track\n";

function downloadTemplate() {
  const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "pulsecheck-accounts-template.csv"; a.click();
  URL.revokeObjectURL(url);
}

// Header alias map -> DB field
const HEADER_MAP: Record<string, string> = {
  name: "name", account: "name", customer: "name", "account name": "name", "customer name": "name",
  arr: "arr", mrr: "mrr", "arr_usd": "arr", "annual revenue": "arr",
  plan: "plan_tier", plan_tier: "plan_tier", tier: "plan_tier",
  csm: "csm_name", csm_name: "csm_name", owner: "csm_name", "account manager": "csm_name",
  renewal: "renewal_date", renewal_date: "renewal_date",
  health: "health_score", health_score: "health_score", score: "health_score",
  usage: "usage_level", usage_level: "usage_level",
  tickets_30: "support_tickets_30d", support_tickets_30d: "support_tickets_30d", tickets_30d: "support_tickets_30d",
  tickets_90: "support_tickets_90d", support_tickets_90d: "support_tickets_90d", tickets_90d: "support_tickets_90d",
  nps: "nps", csat: "csat",
  last_contact: "last_contact_date", last_contact_date: "last_contact_date",
  segment: "segment", notes: "notes",
};

async function parseCsv(file: File): Promise<Array<Record<string, unknown>>> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true, skipEmptyLines: true,
      complete: (res) => {
        try {
          const rows = res.data.map((raw) => {
            const out: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(raw)) {
              const key = HEADER_MAP[k.trim().toLowerCase()];
              if (!key || v == null || v === "") continue;
              if (key === "arr") out.arr_cents = Math.round(parseFloat(v) * 100);
              else if (key === "mrr") out.arr_cents = Math.round(parseFloat(v) * 12 * 100);
              else if (["health_score", "support_tickets_30d", "support_tickets_90d", "nps", "csat"].includes(key)) out[key] = parseInt(v, 10);
              else out[key] = v;
            }
            return out;
          });
          resolve(rows);
        } catch (e) { reject(e); }
      },
      error: reject,
    });
  });
}
