"use client";

import { useEffect, useState } from "react";
import { getToken } from "@/lib/auth";

type Badge = {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  xpThreshold: number;
  earned: boolean;
  earnedAt?: string | null;
};

export default function BadgesPage() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch("http://localhost:4000/gamification/badges", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const body = await res.json();
      if (res.ok) {
        setBadges(body.data);
      } else {
        setError(body.error?.message ?? "Failed to load badges.");
      }
    } catch (err: any) {
      setError(err.message ?? "Server connection error.");
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        Loading badges...
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

  const earnedCount = badges.filter((b) => b.earned).length;
  const totalCount = badges.length;
  const progressPercent = totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0;

  // Helper for rendering local badges emojis/styles
  const badgeIcons: Record<string, string> = {
    "first-step": "🌱",
    "commute": "🚲",
    "volunteering": "🤝",
    "warrior": "🛡️",
  };

  return (
    <div className="space-y-6">
      {/* Header and Progress */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Your Badge Progress</h2>
          <p className="text-sm text-slate-500">
            Earn badges by logging environmental actions and reaching volunteer milestones.
          </p>
        </div>

        <div className="w-full md:w-64 space-y-2 shrink-0">
          <div className="flex justify-between text-sm font-semibold text-slate-700">
            <span>{earnedCount} / {totalCount} Badges Unlocked</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {badges.map((badge) => {
          const emoji = badgeIcons[badge.iconUrl] || "🏆";

          return (
            <div
              key={badge.id}
              className={`relative flex flex-col items-center justify-between rounded-xl border p-6 text-center shadow-sm transition duration-200 ${
                badge.earned
                  ? "bg-white border-slate-200 hover:shadow-md"
                  : "bg-slate-50/50 border-slate-100 opacity-60"
              }`}
            >
              {/* Padlock Icon for locked badges */}
              {!badge.earned && (
                <div className="absolute top-3 right-3 text-slate-400 text-xs font-medium flex items-center bg-slate-100 px-1.5 py-0.5 rounded">
                  🔒 Locked
                </div>
              )}

              <div className="space-y-3 flex-1 flex flex-col items-center justify-center">
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-full text-3xl shadow-inner ${
                    badge.earned
                      ? "bg-emerald-50 border-2 border-emerald-500/20"
                      : "bg-stone-100 border border-slate-200 filter grayscale"
                  }`}
                >
                  {emoji}
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900">{badge.name}</h4>
                  <p className="text-xs text-slate-500 px-1">{badge.description}</p>
                </div>
              </div>

              <div className="mt-5 w-full pt-3 border-t border-slate-100">
                {badge.earned ? (
                  <div className="text-[10px] text-green-700 font-semibold bg-green-50 py-1.5 rounded-lg flex items-center justify-center space-x-1">
                    <span>Unlocks achieved ✔</span>
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-500 font-semibold bg-slate-100 py-1.5 rounded-lg">
                    {badge.xpThreshold > 0
                      ? `Unlocks at ${badge.xpThreshold} XP`
                      : "Challenge Exclusive"}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
