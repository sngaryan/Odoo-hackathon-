"use client";

import { useEffect, useState } from "react";
import { getToken, getCurrentUser, type CurrentUser } from "@/lib/auth";

type CsrActivity = {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  volunteeringHours: number;
  xpReward: number;
  creator: {
    name: string;
    email: string;
  };
  participations: Array<{
    id: string;
    status: "REGISTERED" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
    proofText?: string | null;
  }>;
};

export default function SocialActivitiesPage() {
  const [activities, setActivities] = useState<CsrActivity[]>([]);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals / Form states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newHours, setNewHours] = useState(2);
  const [newXp, setNewXp] = useState(100);
  const [createError, setCreateError] = useState<string | null>(null);

  const [activeProofActivity, setActiveProofActivity] = useState<CsrActivity | null>(null);
  const [proofText, setProofText] = useState("");
  const [proofError, setProofError] = useState<string | null>(null);

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

      const res = await fetch("http://localhost:4000/social/activities", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const body = await res.json();
      if (res.ok) {
        setActivities(body.data);
      } else {
        setError(body.error?.message ?? "Failed to load activities.");
      }
    } catch (err: any) {
      setError(err.message ?? "Server connection error.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRegister(activityId: string) {
    try {
      const token = getToken();
      const res = await fetch(`http://localhost:4000/social/activities/${activityId}/register`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json();

      if (res.ok) {
        loadData();
      } else {
        alert(body.error?.message ?? "Registration failed.");
      }
    } catch (err: any) {
      alert("Error registering.");
    }
  }

  async function handleCreateActivity(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);

    if (!newTitle || !newDescription || !newDate || !newLocation) {
      setCreateError("All fields are required.");
      return;
    }

    try {
      const token = getToken();
      const res = await fetch("http://localhost:4000/social/activities", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          date: newDate,
          location: newLocation,
          volunteeringHours: Number(newHours),
          xpReward: Number(newXp),
        }),
      });
      const body = await res.json();

      if (res.ok) {
        setIsCreateOpen(false);
        // Reset form
        setNewTitle("");
        setNewDescription("");
        setNewDate("");
        setNewLocation("");
        setNewHours(2);
        setNewXp(100);
        loadData();
      } else {
        setCreateError(body.error?.message ?? "Failed to create activity.");
      }
    } catch (err: any) {
      setCreateError("Server connection error.");
    }
  }

  async function handleSubmitProof(e: React.FormEvent) {
    e.preventDefault();
    setProofError(null);

    if (!activeProofActivity) return;
    if (proofText.length < 10) {
      setProofError("Volunteering description must be at least 10 characters.");
      return;
    }

    try {
      const token = getToken();
      const res = await fetch(`http://localhost:4000/social/activities/${activeProofActivity.id}/submit-proof`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ proofText }),
      });
      const body = await res.json();

      if (res.ok) {
        setActiveProofActivity(null);
        setProofText("");
        loadData();
      } else {
        setProofError(body.error?.message ?? "Failed to submit proof.");
      }
    } catch (err: any) {
      setProofError("Server connection error.");
    }
  }

  const isManager = user?.role === "ADMIN" || user?.role === "ESG_MANAGER";

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        Loading activities...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">CSR Activities</h1>
          <p className="text-sm text-slate-500">
            Discover community initiatives, volunteer, and verify your positive social impact.
          </p>
        </div>

        {isManager && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
            type="button"
          >
            Create Activity
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {activities.map((activity) => {
          const userParticipation = activity.participations?.[0];
          const isRegistered = !!userParticipation;
          const status = userParticipation?.status;

          return (
            <div
              key={activity.id}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition duration-200"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/10">
                    +{activity.xpReward} XP
                  </span>
                  {status && (
                    <span
                      className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ${
                        status === "APPROVED"
                          ? "bg-green-100 text-green-800"
                          : status === "PENDING_APPROVAL"
                          ? "bg-yellow-100 text-yellow-800"
                          : status === "REJECTED"
                          ? "bg-red-100 text-red-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {status}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900">{activity.title}</h3>
                  <p className="mt-1 text-sm text-slate-500 line-clamp-3">{activity.description}</p>
                </div>

                <div className="border-t border-slate-100 pt-3 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center">
                    <span className="font-semibold w-16">Date:</span>
                    <span>{new Date(activity.date).toLocaleDateString(undefined, { dateStyle: "long" })}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-semibold w-16">Location:</span>
                    <span>{activity.location}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-semibold w-16">Hours:</span>
                    <span>{activity.volunteeringHours} hrs volunteering</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-semibold w-16">Organized:</span>
                    <span>{activity.creator.name}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100">
                {!isRegistered ? (
                  <button
                    onClick={() => handleRegister(activity.id)}
                    className="w-full rounded-lg bg-slate-900 py-2 text-center text-sm font-semibold text-white hover:bg-slate-800 transition"
                    type="button"
                  >
                    Register / Join
                  </button>
                ) : (
                  <div className="space-y-2">
                    {(status === "REGISTERED" || status === "REJECTED") && (
                      <button
                        onClick={() => {
                          setActiveProofActivity(activity);
                          setProofText(userParticipation.proofText || "");
                        }}
                        className="w-full rounded-lg border border-emerald-600 py-2 text-center text-sm font-semibold text-emerald-600 hover:bg-emerald-50 transition"
                        type="button"
                      >
                        {status === "REJECTED" ? "Resubmit Proof" : "Submit Proof"}
                      </button>
                    )}
                    {status === "PENDING_APPROVAL" && (
                      <p className="text-center text-xs text-yellow-600 font-medium bg-yellow-50 py-2 rounded-lg">
                        Under review by ESG Manager
                      </p>
                    )}
                    {status === "APPROVED" && (
                      <p className="text-center text-xs text-green-700 font-medium bg-green-50 py-2 rounded-lg">
                        Earned +{activity.xpReward} XP ✔
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Creation Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Create CSR Activity</h3>
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

            <form onSubmit={handleCreateActivity} className="space-y-3.5 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2"
                  placeholder="e.g. Tree Plantation Drive"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Description</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 h-20"
                  placeholder="Describe the initiative and what volunteers will do..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Date</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Location</label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2"
                    placeholder="Location"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Volunteering Hours</label>
                  <input
                    type="number"
                    value={newHours}
                    onChange={(e) => setNewHours(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2"
                    min="0"
                    step="0.5"
                  />
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

      {/* Submit Proof Modal */}
      {activeProofActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Submit Volunteering Proof</h3>
              <button
                onClick={() => setActiveProofActivity(null)}
                className="text-slate-400 hover:text-slate-600"
                type="button"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-500">
              Activity: <span className="font-semibold text-slate-800">{activeProofActivity.title}</span>
            </div>

            {proofError && (
              <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700">
                {proofError}
              </div>
            )}

            <form onSubmit={handleSubmitProof} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Volunteering Proof Details
                </label>
                <textarea
                  value={proofText}
                  onChange={(e) => setProofText(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 h-28 text-sm"
                  placeholder="Describe your volunteering contribution. (e.g. what tasks you completed, how long you stayed, photos or drives links...)"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setActiveProofActivity(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  Submit for Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
