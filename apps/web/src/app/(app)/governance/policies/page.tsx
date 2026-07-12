"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

type Policy = { id: string; title: string; version: string; summary: string; acknowledgedAt: string | null };

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    apiRequest<{ data: Policy[] }>("/policies", { signal: controller.signal }).then((response) => response.json()).then((body) => setPolicies(body.data)).catch((error: unknown) => { if (!(error instanceof DOMException && error.name === "AbortError")) setMessage(error instanceof Error ? error.message : "Policies are unavailable right now."); }).finally(() => setIsLoading(false));
    return () => controller.abort();
  }, []);
  async function acknowledge(id: string) {
    setMessage(""); setAcknowledgingId(id);
    try { await apiRequest(`/policies/${id}/acknowledge`, { method: "POST" }); setPolicies((items) => items.map((policy) => policy.id === id ? { ...policy, acknowledgedAt: new Date().toISOString() } : policy)); } catch (error) { setMessage(error instanceof Error ? error.message : "Could not acknowledge policy."); } finally { setAcknowledgingId(null); }
  }
  return (
    <section>
      <p className="text-sm font-medium text-violet-700">Governance</p>
      <h1 className="mt-2 text-3xl font-semibold">Policies</h1>
      <p className="mt-3 text-slate-600">Review the policies that guide EcoSphere operations and record acknowledgements.</p>
      {message && <p className="mt-5 text-sm text-rose-700">{message}</p>}
      {isLoading && <p className="mt-8 text-sm text-slate-500">Loading policies…</p>}
      {!isLoading && policies.length === 0 && !message && <p className="mt-8 text-sm text-slate-500">No active policies are available.</p>}
      <div className="mt-8 space-y-4">{policies.map((policy) => <article key={policy.id} className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"><div><div className="flex gap-2"><h2 className="font-semibold">{policy.title}</h2><span className="text-sm text-slate-500">v{policy.version}</span></div><p className="mt-1 text-sm text-slate-600">{policy.summary}</p></div><button disabled={Boolean(policy.acknowledgedAt) || acknowledgingId === policy.id} onClick={() => acknowledge(policy.id)} className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:bg-slate-400">{policy.acknowledgedAt ? "Acknowledged" : acknowledgingId === policy.id ? "Saving…" : "Acknowledge"}</button></article>)}</div>
    </section>
  );
}
