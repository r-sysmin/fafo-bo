import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAccounts } from "@/lib/accounts.functions";
import { Download } from "lucide-react";
import Papa from "papaparse";

export const Route = createFileRoute("/_authenticated/export")({ component: ExportPage });

/**
 * Neutralises spreadsheet formula injection: a cell whose first character is
 * one of = + - @ tab or CR is executed as a formula by Excel/Sheets.
 */
function escapeCsvCell(value: string | null | undefined): string {
  const s = value ?? "";
  return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
}

function ExportPage() {
  const fetchAccounts = useServerFn(listAccounts);
  const { data: accounts = [] } = useQuery({ queryKey: ["accounts"], queryFn: () => fetchAccounts() });

  function download() {
    const rows = accounts.map((a) => ({
      name: escapeCsvCell(a.name),
      arr: (a.arr_cents ?? 0) / 100,
      plan_tier: escapeCsvCell(a.plan_tier),
      csm: escapeCsvCell(a.csm_name),
      renewal_date: escapeCsvCell(a.renewal_date),
      health_score: a.health_score ?? "",
      status: escapeCsvCell(a.status),
      usage_level: escapeCsvCell(a.usage_level),
      support_tickets_30d: a.support_tickets_30d ?? "",
      support_tickets_90d: a.support_tickets_90d ?? "",
      nps: a.nps ?? "",
      csat: a.csat ?? "",
      last_contact_date: escapeCsvCell(a.last_contact_date),
      segment: escapeCsvCell(a.segment),
      notes: escapeCsvCell(a.notes),
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `pulsecheck-accounts-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl lg:text-4xl">Export</h1>
        <p className="text-sm text-muted-foreground">Download your accounts as CSV.</p>
      </div>
      <div className="glass p-4 sm:p-6">
        <p className="text-sm text-muted-foreground">Ready to export <strong>{accounts.length}</strong> accounts.</p>
        <button onClick={download} disabled={accounts.length === 0} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 sm:w-auto">
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>
    </div>
  );
}
