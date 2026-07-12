"use client";

import { useEffect, useState } from "react";
import { getToken, getCurrentUser, type CurrentUser } from "@/lib/auth";

type Challenge = {
  id: string;
  title: string;
  description: string;
  type: "COMMUTE" | "ENERGY" | "WASTE" | "WATER" | "OTHER";
  xpReward: number;
  badgeRewardId?: string | null;
  badgeReward?: {
    name: string;
    description: string;
    iconUrl: string;
  } | null;
  startDate: string;
  endDate: string;
  submissions: Array<{
    id: string;
    status: "SUBMITTED" | "APPROVED" | "REJECTED";
    proofText: string;
    reviewFeedback?: string | null;
  }>;
};

type Submission = {
  id: string;
  status: "SUBMITTED" | "APPROVED" | "REJECTED";
  proofText: string;
  reviewFeedback?: string | null;
  submittedAt: string;
  approvedAt?: string | null;
  evidence?: Array<{
    id: string;
    originalName: string;
    url: string;
  }>;
  user: {
    id: string;
    name: string;
    email: string;
    department?: {
      name: string;
    } | null;
  };
  challenge: {
    title: string;
    type: string;
    xpReward: number;
    badgeReward?: {
      name: string;
    } | null;
  };
};

type Badge = {
  id: string;
  name: string;
};

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab State for manager view
  const [currentView, setCurrentView] = useState<"challenges" | "approvals" | "history">("challenges");

  // Proof Modal
  const [activeProofChallenge, setActiveProofChallenge] = useState<Challenge | null>(null);
  const [proofText, setProofText] = useState("");
  const [proofPhotos, setProofPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [proofError, setProofError] = useState<string | null>(null);

  // Create Challenge Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newType, setNewType] = useState<"COMMUTE" | "ENERGY" | "WASTE" | "WATER" | "OTHER">("COMMUTE");
  const [newXp, setNewXp] = useState(50);
  const [newBadgeId, setNewBadgeId] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const urls = proofPhotos.map((photo) => URL.createObjectURL(photo));
    setPhotoPreviews(urls);

    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [proofPhotos]);

  function closeProofModal() {
    setActiveProofChallenge(null);
    setProofText("");
    setProofPhotos([]);
    setProofError(null);
  }

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    const validPhotos = selected.filter(
      (photo) => ["image/jpeg", "image/png"].includes(photo.type) && photo.size <= 5 * 1024 * 1024,
    );

    if (validPhotos.length !== selected.length) {
      setProofError("Only JPG or PNG photos up to 5 MB can be attached.");
    } else {
      setProofError(null);
    }

    setProofPhotos((current) => [...current, ...validPhotos].slice(0, 5));
    event.target.value = "";
  }

  async function loadData() {
    setIsLoading(true);
    setError(null);
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);

      const token = getToken();
      if (!token) return;

      // Fetch Challenges
      const chRes = await fetch("http://localhost:4000/gamification/challenges", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const chBody = await chRes.json();
      if (chRes.ok) {
        setChallenges(chBody.data);
      } else {
        setError(chBody.error?.message ?? "Failed to load challenges.");
      }

      // Fetch Submissions (if manager)
      const isMgr = currentUser?.role === "ADMIN" || currentUser?.role === "ESG_MANAGER";
      if (isMgr) {
        const subRes = await fetch("http://localhost:4000/gamification/submissions", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const subBody = await subRes.json();
        if (subRes.ok) {
          setSubmissions(subBody.data);
        }

        // Fetch badges for creation dropdown
        const bgRes = await fetch("http://localhost:4000/gamification/badges", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const bgBody = await bgRes.json();
        if (bgRes.ok) {
          setBadges(bgBody.data);
        }
      }
    } catch (err: any) {
      setError(err.message ?? "Server connection error.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmitProof(e: React.FormEvent) {
    e.preventDefault();
    setProofError(null);

    if (!activeProofChallenge) return;
    if (proofText.length < 10) {
      setProofError("Proof description must be at least 10 characters.");
      return;
    }

    try {
      const token = getToken();
      const formData = new FormData();
      formData.append("proofText", proofText);
      proofPhotos.forEach((photo) => formData.append("photos", photo));

      const res = await fetch(`http://localhost:4000/gamification/challenges/${activeProofChallenge.id}/submit`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const body = await res.json();

      if (res.ok) {
        closeProofModal();
        loadData();
      } else {
        setProofError(body.error?.message ?? "Failed to submit proof.");
      }
    } catch (err: any) {
      setProofError("Server connection error.");
    }
  }

  async function handleCreateChallenge(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);

    if (!newTitle || !newDescription || !newStart || !newEnd) {
      setCreateError("All fields are required.");
      return;
    }

    try {
      const token = getToken();
      const res = await fetch("http://localhost:4000/gamification/challenges", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          type: newType,
          xpReward: Number(newXp),
          badgeRewardId: newBadgeId || null,
          startDate: newStart,
          endDate: newEnd,
        }),
      });
      const body = await res.json();

      if (res.ok) {
        setIsCreateOpen(false);
        // Reset form
        setNewTitle("");
        setNewDescription("");
        setNewType("COMMUTE");
        setNewXp(50);
        setNewBadgeId("");
        setNewStart("");
        setNewEnd("");
        loadData();
      } else {
        setCreateError(body.error?.message ?? "Failed to create challenge.");
      }
    } catch (err: any) {
      setCreateError("Server connection error.");
    }
  }

  async function handleApprove(id: string) {
    try {
      const token = getToken();
      const res = await fetch(`http://localhost:4000/gamification/submissions/${id}/approve`, {
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
    const reviewFeedback = window.prompt("Explain what the employee should improve before resubmitting:");
    if (reviewFeedback === null) return;

    if (reviewFeedback.trim().length < 3) {
      alert("Please enter at least 3 characters of feedback.");
      return;
    }

    try {
      const token = getToken();
      const res = await fetch(`http://localhost:4000/gamification/submissions/${id}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ reviewFeedback: reviewFeedback.trim() }),
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
        Loading challenges...
      </div>
    );
  }

  const pendingSubmissions = submissions.filter((s) => s.status === "SUBMITTED");
  const completedSubmissions = submissions.filter((s) => s.status !== "SUBMITTED");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sustainability Challenges</h1>
          <p className="text-sm text-slate-500">
            Join gamified green initiatives, log commutes, save energy, and accumulate XP points & custom badges.
          </p>
        </div>

        {isManager && (
          <div className="flex space-x-2">
            <button
              onClick={() => setIsCreateOpen(true)}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
              type="button"
            >
              Create Challenge
            </button>
          </div>
        )}
      </div>

      {isManager && (
        <div className="flex border-b border-slate-100 pb-px">
          <button
            onClick={() => setCurrentView("challenges")}
            className={`pb-2.5 text-sm font-medium border-b-2 mr-6 transition ${
              currentView === "challenges"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
            type="button"
          >
            All Challenges ({challenges.length})
          </button>
          <button
            onClick={() => setCurrentView("approvals")}
            className={`pb-2.5 text-sm font-medium border-b-2 mr-6 transition ${
              currentView === "approvals"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
            type="button"
          >
            Pending Submissions ({pendingSubmissions.length})
          </button>
          <button
            onClick={() => setCurrentView("history")}
            className={`pb-2.5 text-sm font-medium border-b-2 transition ${
              currentView === "history"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
            type="button"
          >
            Submission History ({completedSubmissions.length})
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* RENDER ALL CHALLENGES */}
      {currentView === "challenges" && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {challenges.map((challenge) => {
            const userSub = challenge.submissions?.[0];
            const hasSubmitted = !!userSub;
            const status = userSub?.status;

            const isExpired = new Date(challenge.endDate) < new Date();

            return (
              <div
                key={challenge.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition duration-200"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold uppercase ${
                        challenge.type === "COMMUTE"
                          ? "bg-blue-50 text-blue-700"
                          : challenge.type === "ENERGY"
                          ? "bg-yellow-50 text-yellow-700"
                          : challenge.type === "WASTE"
                          ? "bg-purple-50 text-purple-700"
                          : "bg-stone-50 text-stone-700"
                      }`}
                    >
                      {challenge.type}
                    </span>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                      +{challenge.xpReward} XP
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900 leading-snug">{challenge.title}</h3>
                    <p className="mt-1 text-sm text-slate-500 line-clamp-3">{challenge.description}</p>
                  </div>

                  {challenge.badgeReward && (
                    <div className="flex items-center space-x-2 rounded-lg bg-orange-50 border border-orange-100 p-2.5">
                      <div className="text-lg">🏅</div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-orange-800 tracking-wider">Badge Reward</p>
                        <p className="text-xs font-semibold text-slate-800">{challenge.badgeReward.name}</p>
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-slate-500 flex justify-between items-center border-t border-slate-100 pt-3">
                    <span>Ends: {new Date(challenge.endDate).toLocaleDateString()}</span>
                    {isExpired && (
                      <span className="text-red-600 font-semibold text-[10px] uppercase">Expired</span>
                    )}
                  </div>
                </div>

                <div className="mt-5 border-t border-slate-100 pt-3">
                  {!hasSubmitted ? (
                    <button
                      disabled={isExpired}
                      onClick={() => setActiveProofChallenge(challenge)}
                      className={`w-full rounded-lg py-2 text-center text-sm font-semibold text-white transition ${
                        isExpired
                          ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                          : "bg-slate-900 hover:bg-slate-800"
                      }`}
                      type="button"
                    >
                      Submit Commute/Action Proof
                    </button>
                  ) : (
                    <div className="space-y-1 text-center">
                      <p className="text-xs text-slate-400">Your Submission Status:</p>
                      <span
                        className={`inline-flex items-center rounded-md px-3 py-1 text-xs font-semibold ${
                          status === "APPROVED"
                            ? "bg-green-100 text-green-800"
                            : status === "SUBMITTED"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {status === "APPROVED" && "Approved ✔"}
                        {status === "SUBMITTED" && "Pending Approval"}
                        {status === "REJECTED" && "Rejected (Click to Resubmit)"}
                      </span>
                      {status === "REJECTED" && (
                        <div className="mt-2 text-left">
                          {userSub.reviewFeedback ? (
                            <div className="rounded-md border border-rose-200 bg-rose-50 p-2 text-xs text-rose-800">
                              <span className="font-semibold">Reviewer feedback: </span>
                              {userSub.reviewFeedback}
                            </div>
                          ) : null}
                          <button
                            onClick={() => {
                              setActiveProofChallenge(challenge);
                              setProofText(userSub.proofText);
                              setProofPhotos([]);
                              setProofError(null);
                            }}
                            className="mt-2 block w-full text-xs text-emerald-600 font-semibold underline hover:text-emerald-700"
                            type="button"
                          >
                            Resubmit Proof
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* RENDER MANAGER APPROVALS */}
      {currentView === "approvals" && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {pendingSubmissions.length === 0 ? (
            <div className="flex h-36 items-center justify-center text-sm text-slate-400">
              No pending challenge submissions to approve.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingSubmissions.map((sub) => (
                <div key={sub.id} className="p-5 flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-slate-900">{sub.user.name}</span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-500 bg-stone-100 px-2 py-0.5 rounded">
                        {sub.user.department?.name ?? "No Department"}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-800">
                        Challenge: <span className="font-medium text-slate-700">{sub.challenge.title}</span>
                      </h4>
                      <p className="text-xs text-slate-400">
                        Type: <span className="font-semibold">{sub.challenge.type}</span> · XP:{" "}
                        <span className="text-emerald-600 font-semibold">+{sub.challenge.xpReward} XP</span>
                        {sub.challenge.badgeReward && (
                          <span className="text-orange-600 ml-2">🏅 Badge Reward: {sub.challenge.badgeReward.name}</span>
                        )}
                      </p>
                    </div>

                    <div className="rounded-lg bg-stone-50 border border-slate-200 p-3 mt-2">
                      <p className="text-xs font-semibold text-slate-600 mb-1">Employee Submission Proof:</p>
                      <p className="text-xs text-slate-700 italic font-mono whitespace-pre-line">{sub.proofText}</p>
                    </div>
                    {sub.evidence?.length ? (
                      <div className="flex flex-wrap gap-2" aria-label="Submitted photo proof">
                        {sub.evidence.map((photo) => (
                          <a
                            className="block overflow-hidden rounded-md border border-slate-200 bg-white"
                            href={`http://localhost:4000${photo.url}`}
                            key={photo.id}
                            rel="noreferrer"
                            target="_blank"
                          >
                            <img
                              alt={photo.originalName}
                              className="h-16 w-16 object-cover"
                              src={`http://localhost:4000${photo.url}`}
                            />
                          </a>
                        ))}
                      </div>
                    ) : null}
                    <p className="text-[10px] text-slate-400">
                      Submitted on {new Date(sub.submittedAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex md:flex-col gap-2 shrink-0 justify-end">
                    <button
                      onClick={() => handleApprove(sub.id)}
                      className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-semibold shadow-sm transition"
                      type="button"
                    >
                      Approve & Award XP
                    </button>
                    <button
                      onClick={() => handleReject(sub.id)}
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

      {/* RENDER MANAGER SUBMISSION HISTORY */}
      {currentView === "history" && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {completedSubmissions.length === 0 ? (
            <div className="flex h-36 items-center justify-center text-sm text-slate-400">
              No historical approvals or rejections.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold text-xs uppercase tracking-wider">
                  <th className="p-4">Employee</th>
                  <th className="p-4">Challenge</th>
                  <th className="p-4">Submitted Proof</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Reviewed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {completedSubmissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/50">
                    <td className="p-4">
                      <div className="font-semibold text-slate-900">{sub.user.name}</div>
                      <div className="text-xs text-slate-500">{sub.user.department?.name}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-800">{sub.challenge.title}</div>
                      <div className="text-xs text-emerald-600">+{sub.challenge.xpReward} XP</div>
                    </td>
                    <td className="p-4 max-w-xs">
                      <p className="text-xs text-slate-600 line-clamp-2 italic">{sub.proofText}</p>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
                          sub.status === "APPROVED"
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-500">
                      {sub.approvedAt ? new Date(sub.approvedAt).toLocaleDateString() : "Unknown"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* CREATE CHALLENGE MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Create Sustainability Challenge</h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600"
                type="button"
              >
                ✕
              </button>
            </div>

            {createError && (
              <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateChallenge} className="space-y-3.5 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2"
                  placeholder="e.g. Bike to Work Week"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Description</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 h-20"
                  placeholder="Describe the challenge goals and guidelines..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2 bg-white"
                  >
                    <option value="COMMUTE">Commute</option>
                    <option value="ENERGY">Energy</option>
                    <option value="WASTE">Waste</option>
                    <option value="WATER">Water</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">XP Reward</label>
                  <input
                    type="number"
                    value={newXp}
                    onChange={(e) => setNewXp(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Badge Reward (Optional)</label>
                <select
                  value={newBadgeId}
                  onChange={(e) => setNewBadgeId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 bg-white"
                >
                  <option value="">No Badge Reward</option>
                  {badges.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Start Date</label>
                  <input
                    type="date"
                    value={newStart}
                    onChange={(e) => setNewStart(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">End Date</label>
                  <input
                    type="date"
                    value={newEnd}
                    onChange={(e) => setNewEnd(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROOF SUBMISSION MODAL */}
      {activeProofChallenge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Submit Challenge Proof</h3>
              <button
                onClick={closeProofModal}
                className="text-slate-400 hover:text-slate-600"
                type="button"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-500">
              Challenge: <span className="font-semibold text-slate-800">{activeProofChallenge.title}</span>
            </div>

            {proofError && (
              <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700">
                {proofError}
              </div>
            )}

            <form onSubmit={handleSubmitProof} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Evidence of Action (Proof text description)
                </label>
                <textarea
                  value={proofText}
                  onChange={(e) => setProofText(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 h-28 text-sm"
                  placeholder="Describe how you completed this challenge. Include transit methods, details on how you avoided single-use plastics, or hours you spent..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Photo proof (optional)</label>
                <p className="mt-1 text-xs text-slate-500">Attach up to five JPG or PNG photos, each up to 5 MB.</p>
                <label className="mt-2 flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100">
                  <input
                    accept="image/jpeg,image/png"
                    className="sr-only"
                    multiple
                    onChange={handlePhotoChange}
                    type="file"
                  />
                  Add photos
                </label>
                {proofPhotos.length ? (
                  <div className="mt-3 grid grid-cols-5 gap-2">
                    {proofPhotos.map((photo, index) => (
                      <div className="relative" key={`${photo.name}-${photo.lastModified}-${index}`}>
                        <img
                          alt={`Selected proof photo ${index + 1}`}
                          className="h-14 w-full rounded-md border border-slate-200 object-cover"
                          src={photoPreviews[index]}
                        />
                        <button
                          aria-label={`Remove ${photo.name}`}
                          className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-xs text-white"
                          onClick={() => setProofPhotos((current) => current.filter((_, photoIndex) => photoIndex !== index))}
                          type="button"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeProofModal}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  Submit Proof
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
