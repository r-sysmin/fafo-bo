import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import Papa from "papaparse";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { bulkInsertAccounts } from "@/lib/accounts.functions";
import { Download, Upload } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/import")({ component: ImportPage });

const CSV_TEMPLATE = "name,arr,plan_tier,csm,renewal_date,health_score,usage_level,support_tickets_30d,support_tickets_90d,nps,csat,last_contact_date,segment,notes\nAcme Corp,120000,Growth,Ana Ruiz,2026-06-15,72,High,2,7,45,4,2026-05-01,Mid-Market,Renewal on track\n";

const HEADER_MAP: Record<string, string> = {
  name: "name", account: "name", customer: "name", account_name: "name", customer_name: "name",
  arr: "arr", annual_revenue: "arr", mrr: "mrr", monthly_revenue: "mrr",
  plan: "plan_tier", plan_tier: "plan_tier", tier: "plan_tier",
  csm: "csm_name", csm_name: "csm_name", owner: "csm_name", account_manager: "csm_name",
  renewal: "renewal_date", renewal_date: "renewal_date",
  health: "health_score", health_score: "health_score", score: "health_score",
  usage: "usage_level", usage_level: "usage_level", engagement: "usage_level",
  support_tickets_30d: "support_tickets_30d", tickets_30d: "support_tickets_30d",
  support_tickets_90d: "support_tickets_90d", tickets_90d: "support_tickets_90d",
  nps: "nps", csat: "csat",
  last_contact: "last_contact_date", last_contact_date: "last_contact_date",
  segment: "segment", notes: "notes",
};

/** Normalises a CSV header so "Health Score", "health-score" and "health_score" all match. */
function normaliseHeader(h: string) {
  return h.trim().toLowerCase().replace(/[\s-]+/g, "_").replace(/[^a-z0-9_]/g, "");
}


function ImportPage() {
  const qc = useQueryClient();
  const bulk = useServerFn(bulkInsertAccounts);
  const [preview, setPreview] = useState<Record<string, unknown>[]>([]);
  const [fileName, setFileName] = useState("");

  const upload = useMutation({
    mutationFn: (rows: Record<string, unknown>[]) => bulk({ data: { rows: rows as never } }),
    onSuccess: (r) => { toast.success(`Imported ${r.inserted} accounts`); setPreview([]); setFileName(""); qc.invalidateQueries({ queryKey: ["accounts"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  function onFile(file: File) {
    setFileName(file.name);
    Papa.parse<Record<string, string>>(file, {
      header: true, skipEmptyLines: true,
      complete: (res) => {
        const num = (v: string) => Number.parseFloat(String(v).replace(/[^0-9.-]/g, ""));
        const rows = res.data.map((raw) => {
          const out: Record<string, unknown> = {};
          for (const [k, v] of Object.entries(raw)) {
            const key = HEADER_MAP[normaliseHeader(k)];
            if (!key || v == null || String(v).trim() === "") continue;
            if (key === "arr") { const n = num(v); if (Number.isFinite(n)) out.arr_cents = Math.round(n * 100); }
            else if (key === "mrr") { const n = num(v); if (Number.isFinite(n)) out.arr_cents = Math.round(n * 12 * 100); }
            else if (["health_score", "support_tickets_30d", "support_tickets_90d", "nps", "csat"].includes(key)) {
              const n = num(v); if (Number.isFinite(n)) out[key] = Math.round(n);
            }
            else out[key] = String(v).trim();
          }
          return out;
        }).filter((r) => r.name);

        setPreview(rows);
      },
    });
  }

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "pulsecheck-accounts-template.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl lg:text-4xl">Import accounts</h1>
        <p className="text-sm text-muted-foreground">Upload a CSV. Headers are auto-mapped.</p>
      </div>

      <div className="glass p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 sm:w-auto">
            <Upload className="h-4 w-4" /> Choose CSV
            <input type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
          </label>
          <button onClick={downloadTemplate} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-border bg-white/50 px-4 py-2.5 text-sm hover:bg-white/70 sm:w-auto">
            <Download className="h-4 w-4" /> Download template
          </button>
        </div>
        {fileName && <div className="mt-3 text-xs text-muted-foreground">{fileName} · {preview.length} rows detected</div>}
      </div>

      {preview.length > 0 && (
        <div className="glass p-4 sm:p-5">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm font-semibold">Preview (first 10)</div>
            <button onClick={() => upload.mutate(preview)} disabled={upload.isPending} className="min-h-11 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 sm:w-auto">
              Import {preview.length} accounts
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-xs">
              <thead className="text-left text-muted-foreground">
                <tr><th className="p-2">Name</th><th className="p-2">ARR</th><th className="p-2">Segment</th><th className="p-2">Score</th><th className="p-2">Renewal</th></tr>
              </thead>
              <tbody>
                {preview.slice(0, 10).map((r, i) => (
                  <tr key={i} className="border-t border-border/40">
                    <td className="p-2 font-medium">{String(r.name ?? "")}</td>
                    <td className="p-2">${(((r.arr_cents as number) ?? 0) / 100).toLocaleString()}</td>
                    <td className="p-2">{String(r.segment ?? "—")}</td>
                    <td className="p-2">{String(r.health_score ?? "—")}</td>
                    <td className="p-2">{String(r.renewal_date ?? "—")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
