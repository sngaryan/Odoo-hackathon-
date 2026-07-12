"use client";

import { useEffect, useState } from "react";
import { getToken, getCurrentUser, type CurrentUser } from "@/lib/auth";

type Participation = {
  id: string;
  status: "REGISTERED" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
  proofText?: string | null;
  submittedAt?: string | null;
  approvedAt?: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    department?: {
      name: string;
    } | null;
  };
  activity: {
    title: string;
    location: string;
    volunteeringHours: number;
    xpReward: number;
    date: string;
  };
};

export default function SocialParticipationPage() {
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab state for manager
  const [managerTab, setManagerTab] = useState<"pending" | "history">("pending");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    setError(null);
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);

      const token = getToken();
      if (!token) return;

      const res = await fetch("http://localhost:4000/social/participations", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const body = await res.json();
      if (res.ok) {
        setParticipations(body.data);
      } else {
        setError(body.error?.message ?? "Failed to load participations.");
      }
    } catch (err: any) {
      setError(err.message ?? "Server connection error.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleApprove(id: string) {
    try {
      const token = getToken();
      const res = await fetch(`http://localhost:4000/social/participations/${id}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json();

      if (res.ok) {
        loadData();
      } else {
        alert(body.error?.message ?? "Failed to approve.");
      }
    } catch (err: any) {
      alert("Error approving.");
    }
  }

  async function handleReject(id: string) {
    try {
      const token = getToken();
      const res = await fetch(`http://localhost:4000/social/participations/${id}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json();

      if (res.ok) {
        loadData();
      } else {
        alert(body.error?.message ?? "Failed to reject.");
      }
    } catch (err: any) {
      alert("Error rejecting.");
    }
  }

  const isManager = user?.role === "ADMIN" || user?.role === "ESG_MANAGER";

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        Loading participations...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  const pendingList = participations.filter((p) => p.status === "PENDING_APPROVAL");
  const historyList = participations.filter((p) => p.status !== "PENDING_APPROVAL");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {isManager ? "CSR Action Approvals" : "My CSR Participations"}
        </h1>
        <p className="text-sm text-slate-500">
          {isManager
            ? "Review submitted volunteering proofs and allocate XP reward standings to employees."
            : "Track your registered volunteering campaigns, pending verification, and approved badges."}
        </p>
      </div>

      {isManager ? (
        <div className="space-y-6">
          {/* Manager sub tabs */}
          <div className="flex border-b border-slate-100 pb-px">
            <button
              onClick={() => setManagerTab("pending")}
              className={`pb-2.5 text-sm font-medium border-b-2 mr-6 transition ${
                managerTab === "pending"
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
              type="button"
            >
              Pending Approvals ({pendingList.length})
            </button>
            <button
              onClick={() => setManagerTab("history")}
              className={`pb-2.5 text-sm font-medium border-b-2 transition ${
                managerTab === "history"
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
              type="button"
            >
              Approval History ({historyList.length})
            </button>
          </div>

          {/* Pending Section */}
          {managerTab === "pending" && (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              {pendingList.length === 0 ? (
                <div className="flex h-36 items-center justify-center text-sm text-slate-400">
                  No pending volunteering proofs to verify.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {pendingList.map((item) => (
                    <div key={item.id} className="p-5 flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-slate-900">{item.user.name}</span>
                          <span className="text-xs text-slate-400">·</span>
                          <span className="text-xs text-slate-500 bg-stone-100 px-2 py-0.5 rounded">
                            {item.user.department?.name ?? "No Department"}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">
                            Activity: <span className="font-medium text-slate-700">{item.activity.title}</span>
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5">
                            XP Reward: <span className="text-emerald-600 font-semibold">+{item.activity.xpReward} XP</span>
                          </p>
                        </div>
                        <div className="rounded-lg bg-stone-50 border border-slate-200 p-3 mt-2">
                          <p className="text-xs font-semibold text-slate-600 mb-1">Submitted Proof Description:</p>
                          <p className="text-xs text-slate-700 italic font-mono whitespace-pre-line">{item.proofText}</p>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Submitted on {item.submittedAt ? new Date(item.submittedAt).toLocaleString() : "Unknown date"}
                        </p>
                      </div>

                      <div className="flex md:flex-col gap-2 shrink-0 justify-end">
                        <button
                          onClick={() => handleApprove(item.id)}
                          className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-semibold shadow-sm transition"
                          type="button"
                        >
                          Approve & Award XP
                        </button>
                        <button
                          onClick={() => handleReject(item.id)}
                          className="rounded-lg border border-red-200 text-red-600 hover:bg-red-50 px-3 py-1.5 text-xs font-semibold transition"
                          type="button"
                        >
                          Reject Proof
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* History Section */}
          {managerTab === "history" && (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              {historyList.length === 0 ? (
                <div className="flex h-36 items-center justify-center text-sm text-slate-400">
                  No historical approvals found.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold text-xs uppercase tracking-wider">
                      <th className="p-4">Employee</th>
                      <th className="p-4">Activity</th>
                      <th className="p-4">Submitted Proof</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Approved/Rejected At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historyList.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="p-4">
                          <div className="font-semibold text-slate-900">{item.user.name}</div>
                          <div className="text-xs text-slate-500">{item.user.department?.name}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-slate-800">{item.activity.title}</div>
                          <div className="text-xs text-emerald-600">+{item.activity.xpReward} XP</div>
                        </td>
                        <td className="p-4 max-w-xs">
                          <p className="text-xs text-slate-600 line-clamp-2 italic">{item.proofText || "No proof submitted"}</p>
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
                              item.status === "APPROVED"
                                ? "bg-green-50 text-green-700"
                                : item.status === "REJECTED"
                                ? "bg-red-50 text-red-700"
                                : "bg-blue-50 text-blue-700"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="p-4 text-xs text-slate-500">
                          {item.approvedAt ? new Date(item.approvedAt).toLocaleDateString() : "Pending"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Employee View */
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {participations.length === 0 ? (
            <div className="flex h-44 flex-col items-center justify-center text-slate-400 space-y-2 p-6">
              <p className="text-sm">You haven't registered for any CSR activities yet.</p>
              <a
                href="/social/activities"
                className="text-xs font-semibold text-emerald-600 hover:underline"
              >
                Browse activities to join →
              </a>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold text-xs uppercase tracking-wider">
                  <th className="p-4">Activity</th>
                  <th className="p-4">Date & Location</th>
                  <th className="p-4">Volunteering Hours</th>
                  <th className="p-4">Proof Description</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {participations.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="p-4">
                      <div className="font-semibold text-slate-900">{item.activity.title}</div>
                      <div className="text-xs text-emerald-600 font-semibold">+{item.activity.xpReward} XP</div>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-800">{new Date(item.activity.date).toLocaleDateString()}</div>
                      <div className="text-xs text-slate-500">{item.activity.location}</div>
                    </td>
                    <td className="p-4 font-medium text-slate-700">{item.activity.volunteeringHours} hrs</td>
                    <td className="p-4 max-w-xs">
                      {item.proofText ? (
                        <p className="text-xs text-slate-600 italic line-clamp-2">{item.proofText}</p>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No proof submitted yet</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ${
                          item.status === "APPROVED"
                            ? "bg-green-100 text-green-800"
                            : item.status === "PENDING_APPROVAL"
                            ? "bg-yellow-100 text-yellow-800"
                            : item.status === "REJECTED"
                            ? "bg-red-100 text-red-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
