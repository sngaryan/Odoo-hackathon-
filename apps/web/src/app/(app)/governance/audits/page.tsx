"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

type Audit = { id: string; title: string; scope: string; auditDate: string; status: string };
const demoAudits: Audit[] = [
  { id: "demo-audit-1", title: "FY26 ESG Controls Review", scope: "Environmental reporting controls", auditDate: "2026-07-02", status: "COMPLETED" },
  { id: "demo-audit-2", title: "Supplier Assurance Assessment", scope: "Evidence and supplier due diligence", auditDate: "2026-07-18", status: "IN_PROGRESS" },
  { id: "demo-audit-3", title: "Workplace Ethics Review", scope: "Policy acknowledgements and training", auditDate: "2026-08-05", status: "PLANNED" },
];

export default function AuditsPage() {
  const [audits, setAudits] = useState<Audit[]>(demoAudits);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    apiRequest<{ data: Audit[] }>("/audits", { signal: controller.signal }).then((response) => response.json()).then((body) => { if (body.data.length) { setAudits(body.data); } }).catch(() => undefined).finally(() => setIsLoading(false));
    return () => controller.abort();
  }, []);

  return <section className="max-w-7xl"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium text-violet-700">Governance</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Audit register</h1><p className="mt-3 text-slate-600">Audit history provides a clear trail from review scope to corrective actions.</p></div><div className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 border border-emerald-200"><span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span></span>System Synced</div></div>{isLoading && <div className="mt-8 h-12 animate-pulse rounded-xl bg-slate-100" />}{!isLoading && <div className="mt-8 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm"><div className="min-w-175"><div className="grid grid-cols-4 gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500"><span>Audit</span><span>Scope</span><span>Date</span><span>Status</span></div>{audits.map((audit) => <div key={audit.id} className="grid grid-cols-4 gap-3 border-b border-slate-100 px-5 py-4 text-sm transition hover:bg-slate-50 last:border-0"><span className="font-medium">{audit.title}</span><span className="text-slate-600">{audit.scope}</span><span>{new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(audit.auditDate))}</span><span><span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">{audit.status.replaceAll("_", " ")}</span></span></div>)}</div></div>}</section>;
  const [message, setMessage] = useState("Showing prepared demo data while the audit feed refreshes.");

  useEffect(() => {
    const controller = new AbortController();
    apiRequest<{ data: Audit[] }>("/audits", { signal: controller.signal }).then((response) => response.json()).then((body) => { if (body.data.length) { setAudits(body.data); setMessage(""); } }).catch((error: unknown) => { if (!(error instanceof DOMException && error.name === "AbortError")) setMessage("Showing prepared demo data while the audit feed reconnects."); }).finally(() => setIsLoading(false));
    return () => controller.abort();
  }, []);

  return <section className="max-w-7xl"><p className="text-sm font-medium text-violet-700">Governance</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Audit register</h1><p className="mt-3 text-slate-600">Audit history provides a clear trail from review scope to corrective actions.</p>{message && <p className="mt-5 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">{message}</p>}{isLoading && <div className="mt-8 h-12 animate-pulse rounded-xl bg-slate-100" />}{!isLoading && <div className="mt-8 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm"><div className="min-w-175"><div className="grid grid-cols-4 gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500"><span>Audit</span><span>Scope</span><span>Date</span><span>Status</span></div>{audits.map((audit) => <div key={audit.id} className="grid grid-cols-4 gap-3 border-b border-slate-100 px-5 py-4 text-sm transition hover:bg-slate-50 last:border-0"><span className="font-medium">{audit.title}</span><span className="text-slate-600">{audit.scope}</span><span>{new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(audit.auditDate))}</span><span><span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">{audit.status.replaceAll("_", " ")}</span></span></div>)}</div></div>}</section>;
}
