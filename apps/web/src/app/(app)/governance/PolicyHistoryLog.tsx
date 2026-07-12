"use client";

import React from "react";
import { Clock, ShieldAlert } from "lucide-react";

export type HistoryEvent = {
  id: string;
  timestamp: string;
  userName: string;
  userRole: string;
  userDept?: string;
  action: string;
  policyTitle: string;
  policyVersion: string;
};

const defaultHistory: HistoryEvent[] = [
  {
    id: "hist-1",
    timestamp: "2026-07-11T14:32:00.000Z",
    userName: "Sarah Jenkins",
    userRole: "Auditor",
    userDept: "Quality & Risk Compliance",
    action: "Accepted Policy",
    policyTitle: "Environmental Data Integrity",
    policyVersion: "1.0",
  },
  {
    id: "hist-2",
    timestamp: "2026-07-10T09:15:00.000Z",
    userName: "Michael Chang",
    userRole: "ESG Manager",
    userDept: "Operations & Supply Chain",
    action: "Accepted Policy",
    policyTitle: "Environmental Data Integrity",
    policyVersion: "1.0",
  },
  {
    id: "hist-3",
    timestamp: "2026-07-08T16:45:00.000Z",
    userName: "Amit Patel",
    userRole: "Director",
    userDept: "Legal & Governance",
    action: "Accepted Policy",
    policyTitle: "Responsible Workplace",
    policyVersion: "2.1",
  },
  {
    id: "hist-4",
    timestamp: "2026-07-05T11:00:00.000Z",
    userName: "Ananya Rao",
    userRole: "Compliance Specialist",
    userDept: "ESG Risk Management",
    action: "Accepted Policy",
    policyTitle: "Responsible Workplace",
    policyVersion: "2.1",
  },
];

interface PolicyHistoryLogProps {
  sessionEvents?: HistoryEvent[];
}

export function PolicyHistoryLog({ sessionEvents = [] }: PolicyHistoryLogProps) {
  // Combine session-specific events with default demo history
  const allEvents = [...sessionEvents, ...defaultHistory].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const formatTime = (isoString: string) => {
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(isoString));
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Acknowledgement Log</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time audit log of corporate policy acceptances.
          </p>
        </div>
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
          Active Sync
        </span>
      </div>

      {allEvents.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <ShieldAlert className="h-8 w-8 mx-auto text-slate-400 mb-2" />
          <p className="text-sm">No historical policy acceptances recorded yet.</p>
        </div>
      ) : (
        <div className="relative pl-6 after:absolute after:inset-y-1 after:left-[11px] after:w-[2px] after:bg-slate-100">
          <div className="space-y-6">
            {allEvents.map((event) => {
              const isSessionEvent = event.id.startsWith("session-");
              return (
                <div key={event.id} className="relative group">
                  {/* Timeline icon indicator */}
                  <span className="absolute -left-[27px] top-1.5 flex h-[14px] w-[14px] items-center justify-center rounded-full bg-white ring-2 ring-emerald-500 z-10 transition duration-200 group-hover:scale-110">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>

                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">
                          {event.userName}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          ({event.userRole}
                          {event.userDept ? ` · ${event.userDept}` : ""})
                        </span>
                        {isSessionEvent && (
                          <span className="animate-pulse inline-flex items-center rounded-full bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                            New
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-600">
                        {event.action}{" "}
                        <span className="font-semibold text-slate-700">
                          &ldquo;{event.policyTitle}&rdquo;
                        </span>{" "}
                        <span className="text-slate-500">v{event.policyVersion}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-400 shrink-0 self-start md:self-auto">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-xs font-medium text-slate-500">
                        {formatTime(event.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
