"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

type Overview = { kpis: { activePolicies: number; acknowledgedPolicies: number; openIssues: number; completedAudits: number }; riskList: { id: string; title: string; severity: string; status: string }[] };

const demoOverview: Overview = {
  kpis: { activePolicies: 18, acknowledgedPolicies: 146, openIssues: 7, completedAudits: 24 },
  riskList: [
    { id: "demo-1", title: "Supplier evidence renewal due in 8 days", severity: "HIGH", status: "IN_PROGRESS" },
    { id: "demo-2", title: "Travel-emissions variance requires review", severity: "MEDIUM", status: "OPEN" },
  ],
};
const monthlyControlHealth = [62, 68, 71, 76, 74, 82, 86, 89, 91, 88, 94, 96];

export default function DashboardPage() {
  const [overview, setOverview] = useState<Overview>(demoOverview);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    apiRequest<{ data: Overview }>("/dashboard/overview", { signal: controller.signal })
      .then((response) => response.json())
      .then((body) => { if (body.data) { setOverview(body.data); setIsLive(true); } })
      .catch((error: unknown) => { if (!(error instanceof DOMException && error.name === "AbortError")) setMessage("Showing prepared demo data while the live governance feed reconnects."); })
      .finally(() => setIsLoading(false));
    return () => controller.abort();
  }, []);

  const kpis = [["Active policies", overview.kpis.activePolicies, "+3 this quarter", "Policies"], ["Open compliance issues", overview.kpis.openIssues, "2 high priority", "Compliance"], ["Completed audits", overview.kpis.completedAudits, "+18% completion", "Assurance"], ["Policy acknowledgements", overview.kpis.acknowledgedPolicies, "94% organisation-wide", "Adoption"]];

  return <section className="max-w-7xl"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium text-emerald-700">Executive governance</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Governance command centre</h1><p className="mt-3 text-slate-600">Policies, assurance, compliance risk, and reporting readiness in one view.</p></div><span className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ${isLive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{isLoading ? "Refreshing…" : isLive ? "Live governance data" : "Demo-ready preview"}</span></div>{message && <p className="mt-5 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">{message}</p>}<div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{kpis.map(([label, value, note, category], index) => <article key={label} style={{ animationDelay: `${index * 70}ms` }} className="animate-in fade-in slide-in-from-bottom-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md"><div className="flex items-center justify-between"><p className="text-sm text-slate-500">{label}</p><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">{category}</span></div><p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">{value}</p><p className="mt-2 text-xs font-medium text-emerald-700">{note}</p></article>)}</div><div className="mt-6 grid gap-6 lg:grid-cols-5"><article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-3"><div className="flex items-start justify-between"><div><h2 className="font-semibold">Control health trend</h2><p className="mt-1 text-sm text-slate-500">Monthly assurance score · trailing 12 months</p></div><span className="text-sm font-semibold text-emerald-700">96%</span></div><div className="mt-8 flex h-36 items-end gap-1.5">{monthlyControlHealth.map((value, index) => <div key={`${value}-${index}`} className="group flex h-full flex-1 items-end"><div title={`${value}%`} style={{ height: `${value}%`, animationDelay: `${index * 55}ms` }} className="animate-in fade-in slide-in-from-bottom-4 w-full rounded-t bg-emerald-500 transition duration-200 group-hover:bg-emerald-700" /></div>)}</div><div className="mt-3 flex justify-between text-xs text-slate-400"><span>Aug ’25</span><span>Jul ’26</span></div></article><article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2"><h2 className="font-semibold">Reporting readiness</h2><p className="mt-1 text-sm text-slate-500">A downloadable CSV is available for each governance view.</p><div className="mt-6 space-y-4">{[["Governance overview", "Ready"], ["Compliance register", "Ready"], ["Audit register", "Ready"]].map(([label, state]) => <div key={label} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0"><span className="text-sm font-medium">{label}</span><span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">{state}</span></div>)}</div></article></div><section className="mt-6"><div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Priority risk queue</h2><span className="text-sm text-slate-500">{overview.riskList.length} items requiring attention</span></div><div className="grid gap-3 md:grid-cols-2">{overview.riskList.map((risk) => <article key={risk.id} className="rounded-xl border border-amber-200 bg-amber-50 p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-sm"><p className="font-semibold text-amber-950">{risk.title}</p><p className="mt-2 text-sm text-amber-900">{risk.severity} severity · {risk.status.replaceAll("_", " ")}</p></article>)}</div></section></section>;
}
