"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ToastContainer, type ToastMessage } from "@/components/Toast";
import { AlertTriangle, Clock, CheckCircle2, User, Calendar, ShieldCheck, ChevronDown } from "lucide-react";

type Issue = {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  openedAt: string;
  dueDate?: string;
  owner: { name: string } | null;
  audit?: { title: string } | null;
};

const demoIssues: Issue[] = [
  {
    id: "demo-issue-1",
    title: "Supplier evidence renewal due",
    description: "Two priority suppliers require refreshed emissions-source documentation before the monthly close.",
    severity: "HIGH",
    status: "IN_PROGRESS",
    openedAt: "2026-07-04",
    dueDate: "2026-07-20",
    owner: { name: "Sustainability Operations" },
    audit: { title: "Supplier Assurance Assessment" }
  },
  {
    id: "demo-issue-2",
    title: "Travel emissions variance review",
    description: "A material variance was detected between corporate travel and the approved forecasting baseline.",
    severity: "MEDIUM",
    status: "OPEN",
    openedAt: "2026-07-08",
    dueDate: "2026-07-25",
    owner: { name: "Corporate Services" },
    audit: { title: "FY26 ESG Controls Review" }
  },
];

const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" });

let nextToastId = 0;
function getNextToastId() {
  nextToastId += 1;
  return `toast-${nextToastId}-${Date.now()}`;
}

export default function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>(demoIssues);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = getNextToastId();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };


  useEffect(() => {
    const controller = new AbortController();
    apiRequest<{ data: Issue[] }>("/compliance-issues", { signal: controller.signal })
      .then((response) => response.json())
      .then((body) => {
        if (body.data && body.data.length) setIssues(body.data);
      })
      .catch(() => undefined)
      .finally(() => setIsLoading(false));
    return () => controller.abort();
  }, []);

  const updateIssueStatus = async (id: string, newStatus: string) => {
    const previousIssues = [...issues];
    const targetIssue = issues.find((issue) => issue.id === id);
    if (!targetIssue) return;

    // Optimistic UI Update
    setIssues((prev) =>
      prev.map((issue) => (issue.id === id ? { ...issue, status: newStatus } : issue))
    );
    showToast(`Issue status updated to ${newStatus.replaceAll("_", " ")}`, "success");
    setUpdatingId(id);

    try {
      await apiRequest(`/compliance-issues/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (error: unknown) {
      // Revert on error
      setIssues(previousIssues);
      const errMsg = error instanceof Error ? error.message : "Failed to update issue status.";
      showToast(errMsg, "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity.toUpperCase()) {
      case "HIGH":
      case "CRITICAL":
        return "bg-rose-50 text-rose-700 border-rose-200 ring-rose-600/10";
      case "MEDIUM":
        return "bg-amber-50 text-amber-700 border-amber-200 ring-amber-600/10";
      case "LOW":
      default:
        return "bg-slate-50 text-slate-600 border-slate-200 ring-slate-500/10";
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status.toUpperCase()) {
      case "RESOLVED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-600/10";
      case "IN_PROGRESS":
        return "bg-blue-50 text-blue-700 border-blue-200 ring-blue-600/10";
      case "OPEN":
      default:
        return "bg-rose-50 text-rose-700 border-rose-200 ring-rose-600/10";
    }
  };

  return (
    <section className="max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5 mb-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">Governance</p>
          <h1 className="mt-1 text-3xl font-extrabold text-slate-900 tracking-tight">Compliance Issues</h1>
          <p className="mt-2 text-sm text-slate-600">
            Track and resolve compliance incidents, audit findings, and regulatory gaps.
          </p>
        </div>
      </div>

      {isLoading && <div className="h-28 animate-pulse rounded-xl bg-slate-100 mb-8" />}

      <div className="grid gap-6 md:grid-cols-2">
        {issues.map((issue) => (
          <ErrorBoundary key={issue.id}>
            <article className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-slate-300 text-left">
              {/* Header Details */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <h2 className="font-bold text-slate-900 text-lg leading-snug">{issue.title}</h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${getSeverityStyles(issue.severity)}`}>
                      {issue.severity} Severity
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${getStatusStyles(issue.status)}`}>
                      {issue.status === "RESOLVED" && <CheckCircle2 className="h-3 w-3 shrink-0" />}
                      {issue.status === "IN_PROGRESS" && <Clock className="h-3 w-3 shrink-0" />}
                      {issue.status === "OPEN" && <AlertTriangle className="h-3 w-3 shrink-0" />}
                      {issue.status.replaceAll("_", " ")}
                    </span>
                  </div>
                </div>

                {/* Interactive Status Changer */}
                <div className="relative shrink-0">
                  {issue.status === "RESOLVED" ? (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 border border-emerald-200 shadow-sm opacity-90">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Closed
                    </span>
                  ) : (
                    <div className="relative flex items-center">
                      <select
                        disabled={updatingId === issue.id}
                        value={issue.status}
                        onChange={(e) => updateIssueStatus(issue.id, e.target.value)}
                        className={`appearance-none rounded-lg border border-slate-300 bg-white pl-3 pr-8 py-1.5 text-xs font-bold text-slate-700 shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 transition cursor-pointer hover:bg-slate-50 disabled:bg-slate-50 disabled:cursor-not-allowed`}
                      >
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="mt-5 border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Description</p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{issue.description}</p>
              </div>

              {/* Attributes Grid */}
              <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 bg-slate-50 rounded-xl p-4 border border-slate-100 text-sm">
                <div>
                  <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <ShieldCheck className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    Audit Source
                  </dt>
                  <dd className="mt-1 font-semibold text-slate-700 truncate">{issue.audit?.title ?? "Self-reported"}</dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    Accountable Owner
                  </dt>
                  <dd className="mt-1 font-semibold text-slate-700 truncate">{issue.owner?.name ?? "Unassigned"}</dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    Due Date
                  </dt>
                  <dd className="mt-1 font-semibold text-slate-700">
                    {issue.dueDate ? dateFormat.format(new Date(issue.dueDate)) : "Not scheduled"}
                  </dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    Opened
                  </dt>
                  <dd className="mt-1 font-semibold text-slate-700">{dateFormat.format(new Date(issue.openedAt))}</dd>
                </div>
              </dl>
            </article>
          </ErrorBoundary>
        ))}
      </div>

      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </section>
  );
}
