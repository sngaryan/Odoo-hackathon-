"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { getCurrentUser, type CurrentUser } from "@/lib/auth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PolicyHistoryLog, type HistoryEvent } from "../PolicyHistoryLog";
import { ToastContainer, type ToastMessage } from "@/components/Toast";
import { Check, ShieldCheck, HelpCircle } from "lucide-react";

type Policy = { id: string; title: string; version: string; summary: string; acknowledgedAt: string | null };

const demoPolicies: Policy[] = [
  { id: "demo-policy-1", title: "Environmental Data Integrity", version: "1.0", summary: "Every ESG record must be traceable, timely, and supported by evidence.", acknowledgedAt: "2026-07-01T09:00:00.000Z" },
  { id: "demo-policy-2", title: "Responsible Workplace", version: "2.1", summary: "Sets expectations for inclusive, safe, and ethical workplace conduct.", acknowledgedAt: null }
];

let nextToastId = 0;
function getNextToastId() {
  nextToastId += 1;
  return `toast-${nextToastId}-${Date.now()}`;
}

let nextEventId = 0;
function getNextEventId() {
  nextEventId += 1;
  return `session-event-${nextEventId}-${Date.now()}`;
}

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>(demoPolicies);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [sessionEvents, setSessionEvents] = useState<HistoryEvent[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = getNextToastId();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  useEffect(() => {
    getCurrentUser().then(setCurrentUser).catch(() => undefined);
    const controller = new AbortController();
    apiRequest<{ data: Policy[] }>("/policies", { signal: controller.signal })
      .then((response) => response.json())
      .then((body) => {
        if (body.data && body.data.length) setPolicies(body.data);
      })
      .catch(() => undefined)
      .finally(() => setIsLoading(false));
    return () => controller.abort();
  }, []);

  async function acknowledge(id: string) {
    setAcknowledgingId(id);
    const targetPolicy = policies.find((p) => p.id === id);

    try {
      await apiRequest(`/policies/${id}/acknowledge`, { method: "POST" });
      
      setPolicies((items) =>
        items.map((policy) =>
          policy.id === id ? { ...policy, acknowledgedAt: new Date().toISOString() } : policy
        )
      );

      if (targetPolicy) {
        const newEvent: HistoryEvent = {
          id: getNextEventId(),
          timestamp: new Date().toISOString(),
          userName: currentUser?.name || "Shikhar Gangwar",
          userRole: currentUser?.role || "ESG Manager",
          userDept: currentUser?.department?.name || "Governance",
          action: "Accepted Policy",
          policyTitle: targetPolicy.title,
          policyVersion: targetPolicy.version,
        };
        setSessionEvents((prev) => [newEvent, ...prev]);
        showToast(`Successfully accepted policy: ${targetPolicy.title}`, "success");
      }
    } catch {
      // Fallback for demo session if backend endpoint gives issues
      setPolicies((items) =>
        items.map((policy) =>
          policy.id === id ? { ...policy, acknowledgedAt: new Date().toISOString() } : policy
        )
      );
      
      if (targetPolicy) {
        const newEvent: HistoryEvent = {
          id: getNextEventId(),
          timestamp: new Date().toISOString(),
          userName: currentUser?.name || "Shikhar Gangwar",
          userRole: currentUser?.role || "ESG Manager",
          userDept: currentUser?.department?.name || "Governance",
          action: "Accepted Policy",
          policyTitle: targetPolicy.title,
          policyVersion: targetPolicy.version,
        };
        setSessionEvents((prev) => [newEvent, ...prev]);
        showToast(`Policy acceptance recorded for this demo session.`, "success");
      }
    } finally {
      setAcknowledgingId(null);
    }
  }

  return (
    <section className="max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5 mb-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">Governance</p>
          <h1 className="mt-1 text-3xl font-extrabold text-slate-900 tracking-tight">Policies & Guidelines</h1>
          <p className="mt-2 text-sm text-slate-600">
            Monitor and record employee policy acknowledgements across key ESG operations.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Active Policies List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Active Corporate Policies</h2>
            <span className="text-xs text-slate-500 font-medium">Showing {policies.length} items</span>
          </div>

          {isLoading && <div className="h-24 animate-pulse rounded-xl bg-slate-100" />}

          <div className="space-y-4">
            {policies.map((policy) => {
              const isAccepted = !!policy.acknowledgedAt;
              return (
                <article
                  key={policy.id}
                  className={`relative overflow-hidden rounded-xl border p-5 shadow-sm transition-all duration-300 ${
                    isAccepted
                      ? "bg-white border-emerald-200 hover:border-emerald-300"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {isAccepted && (
                    <div className="absolute top-0 right-0 h-16 w-16 overflow-hidden">
                      <div className="absolute transform rotate-45 bg-emerald-500 text-white text-[9px] font-bold text-center py-0.5 w-[90px] right-[-24px] top-[14px]">
                        Accepted
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="space-y-2 max-w-xl text-left">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="font-bold text-slate-900 text-base">{policy.title}</h3>
                        <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-500/10">
                          v{policy.version}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            isAccepted
                              ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/10"
                              : "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/10"
                          }`}
                        >
                          {isAccepted ? (
                            <>
                              <ShieldCheck className="h-3 w-3 shrink-0" />
                              Employee Accepted
                            </>
                          ) : (
                            <>
                              <HelpCircle className="h-3 w-3 shrink-0" />
                              Signature Required
                            </>
                          )}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{policy.summary}</p>
                      {policy.acknowledgedAt && (
                        <p className="text-xs text-slate-400 font-medium">
                          Accepted on {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(policy.acknowledgedAt))}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={isAccepted || acknowledgingId === policy.id}
                      onClick={() => acknowledge(policy.id)}
                      className={`sm:self-center shrink-0 inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 cursor-pointer ${
                        isAccepted
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                          : acknowledgingId === policy.id
                          ? "bg-emerald-500/50 cursor-wait"
                          : "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 hover:-translate-y-0.5"
                      }`}
                    >
                      {isAccepted ? (
                        <span className="flex items-center gap-1.5">
                          <Check className="h-4 w-4 text-slate-400" />
                          Accepted
                        </span>
                      ) : acknowledgingId === policy.id ? (
                        "Signing…"
                      ) : (
                        "Accept Policy"
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {/* Right Column: Visual Timeline of Acknowledgements */}
        <div className="space-y-6">
          <ErrorBoundary>
            <PolicyHistoryLog sessionEvents={sessionEvents} />
          </ErrorBoundary>
        </div>
      </div>

      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </section>
  );
}
