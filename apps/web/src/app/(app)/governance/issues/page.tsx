"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

type Issue = { id: string; title: string; description: string; severity: string; status: string; openedAt: string; owner: { name: string } | null };
const demoIssues: Issue[] = [
  { id: "demo-issue-1", title: "Supplier evidence renewal due", description: "Two priority suppliers require refreshed emissions-source documentation before the monthly close.", severity: "HIGH", status: "IN_PROGRESS", openedAt: "2026-07-04", owner: { name: "Sustainability Operations" } },
  { id: "demo-issue-2", title: "Travel emissions variance review", description: "A material variance was detected between corporate travel and the approved forecasting baseline.", severity: "MEDIUM", status: "OPEN", openedAt: "2026-07-08", owner: { name: "Corporate Services" } },
];

export default function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>(demoIssues);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("Showing prepared demo data while the compliance feed refreshes.");

  useEffect(() => {
    const controller = new AbortController();
    apiRequest<{ data: Issue[] }>("/compliance-issues", { signal: controller.signal }).then((response) => response.json()).then((body) => { if (body.data.length) { setIssues(body.data); setMessage(""); } }).catch((error: unknown) => { if (!(error instanceof DOMException && error.name === "AbortError")) setMessage("Showing prepared demo data while the compliance feed reconnects."); }).finally(() => setIsLoading(false));
    return () => controller.abort();
  }, []);

  return <section className="max-w-7xl"><p className="text-sm font-medium text-violet-700">Governance</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Compliance issues</h1><p className="mt-3 text-slate-600">Track issues to resolution with clear severity, ownership, and status.</p>{message && <p className="mt-5 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">{message}</p>}{isLoading && <div className="mt-8 h-28 animate-pulse rounded-xl bg-slate-100" />}<div className="mt-8 grid gap-4 lg:grid-cols-2">{issues.map((issue) => <article key={issue.id} className="rounded-xl border border-amber-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md"><div className="flex flex-wrap items-center gap-3"><h2 className="font-semibold">{issue.title}</h2><span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">{issue.severity}</span><span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-800">{issue.status.replaceAll("_", " ")}</span></div><p className="mt-3 text-sm leading-6 text-slate-600">{issue.description}</p><div className="mt-5 border-t border-slate-100 pt-4 text-sm text-slate-500">Owner: {issue.owner?.name ?? "Unassigned"} · Opened {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(issue.openedAt))}</div></article>)}</div></section>;
}
