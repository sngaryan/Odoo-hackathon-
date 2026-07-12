"use client";

import { useState } from "react";
import { apiRequest } from "@/lib/api";

type ReportType = "governance" | "issues" | "audits";

const demoCsvRows: Record<ReportType, string[]> = {
  governance: ["Policy,Version,Status,Acknowledgements", "Environmental Data Integrity,1.0,ACTIVE,146", "Responsible Workplace,2.1,ACTIVE,139"],
  issues: ["Issue,Severity,Status,Owner", "Supplier evidence renewal due,HIGH,IN_PROGRESS,Sustainability Operations", "Travel emissions variance review,MEDIUM,OPEN,Corporate Services"],
  audits: ["Audit,Scope,Date,Status", "FY26 ESG Controls Review,Environmental reporting controls,2026-07-02,COMPLETED", "Supplier Assurance Assessment,Evidence and supplier due diligence,2026-07-18,IN_PROGRESS"],
};

function downloadCsv(type: ReportType, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ecosphere-${type}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export default function ReportsPage() {
  const [message, setMessage] = useState("");
  const [exportingType, setExportingType] = useState<ReportType | null>(null);
  const [completedType, setCompletedType] = useState<ReportType | null>(null);

  async function exportReport(type: ReportType) {
    setMessage(""); setCompletedType(null); setExportingType(type);
    try {
      const response = await apiRequest("/reports/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, format: "csv", filters: {} }) });
      const blob = await response.blob();
      if (blob.size === 0) throw new Error("The report was empty.");
      downloadCsv(type, blob);
    } catch {
      downloadCsv(type, new Blob([demoCsvRows[type].join("\n")], { type: "text/csv;charset=utf-8" }));
      setMessage("Live reporting is unavailable, so a prepared demo CSV was downloaded instead.");
    } finally { setCompletedType(type); setExportingType(null); }
  }

  const reports: [ReportType, string, string, string][] = [["governance", "Governance overview", "Policy status and acknowledgements", "18 policies · 146 acknowledgements"], ["issues", "Compliance issues", "Issue ownership and lifecycle", "7 open · 2 high priority"], ["audits", "Audit register", "Completed and upcoming audit activity", "24 completed · 3 planned"]];

  return <section className="max-w-7xl"><p className="text-sm font-medium text-slate-700">Reports</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">ESG reports</h1><p className="mt-3 text-slate-600">Export traceable governance data for executive review and audit preparation.</p><div aria-live="polite" className="mt-5">{message && <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{message}</p>}{completedType && <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{completedType[0].toUpperCase() + completedType.slice(1)} CSV downloaded successfully.</p>}</div><div className="mt-8 grid gap-4 md:grid-cols-3">{reports.map(([type, title, description, detail]) => <article key={type} className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md"><div className="flex items-start justify-between"><h2 className="font-semibold">{title}</h2><span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">CSV</span></div><p className="mt-2 text-sm text-slate-600">{description}</p><p className="mt-4 text-xs font-medium text-slate-500">{detail}</p><button type="button" disabled={exportingType !== null} onClick={() => exportReport(type)} className="mt-5 inline-flex min-w-28 items-center justify-center rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">{exportingType === type ? <><span className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />Preparing…</> : completedType === type ? "Downloaded" : "Export CSV"}</button></article>)}</div></section>;
}
