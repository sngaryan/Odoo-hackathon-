"use client";

import { useEffect, useState } from "react";
import { getToken, getCurrentUser, type CurrentUser } from "@/lib/auth";

type EmployeeStanding = {
  id: string;
  name: string;
  email: string;
  role: string;
  xp: number;
  department: string;
  departmentCode: string;
  badgesCount: number;
};

type DepartmentStanding = {
  id: string;
  name: string;
  code: string;
  totalXp: number;
  memberCount: number;
};

type LeaderboardData = {
  employees: EmployeeStanding[];
  departments: DepartmentStanding[];
};

export default function LeaderboardPage() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    setError(null);
    try {
      const userObj = await getCurrentUser();
      setCurrentUser(userObj);

      const token = getToken();
      if (!token) return;

      const res = await fetch("http://localhost:4000/gamification/leaderboard", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const body = await res.json();
      if (res.ok) {
        setData(body.data);
      } else {
        setError(body.error?.message ?? "Failed to load leaderboard.");
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
        Loading leaderboards...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
        {error ?? "Leaderboard data not available."}
      </div>
    );
  }

  // Find max XP for relative progress bars
  const maxEmployeeXp = data.employees[0]?.xp || 1;
  const maxDeptXp = data.departments[0]?.totalXp || 1;

  // Helper for rank medallions
  function getRankBadge(rank: number) {
    if (rank === 1) return <span className="text-xl">🥇</span>;
    if (rank === 2) return <span className="text-xl">🥈</span>;
    if (rank === 3) return <span className="text-xl">🥉</span>;
    return <span className="text-slate-400 font-bold font-mono">#{rank}</span>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">ESG Leaderboards</h1>
        <p className="text-sm text-slate-500">
          Compete constructively across departments to see who drives the most carbon offsets and sustainability impact.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* EMPLOYEE RANKINGS */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Individual Standings</h3>
            <p className="text-xs text-slate-500">Ranked by accumulated volunteering & challenge XP.</p>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-100">
            <table className="w-full border-collapse text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="p-3 text-center w-12">Rank</th>
                  <th className="p-3">Employee</th>
                  <th className="p-3 text-center">Badges</th>
                  <th className="p-3 text-right">XP Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.employees.map((emp, index) => {
                  const rank = index + 1;
                  const isCurrent = currentUser?.id === emp.id;

                  return (
                    <tr
                      key={emp.id}
                      className={`hover:bg-slate-50/50 transition ${
                        isCurrent ? "bg-emerald-50/40 hover:bg-emerald-50/60" : ""
                      }`}
                    >
                      <td className="p-3 text-center">{getRankBadge(rank)}</td>
                      <td className="p-3">
                        <div className="flex items-center space-x-1.5">
                          <span className={`font-semibold ${isCurrent ? "text-emerald-700 font-bold" : "text-slate-900"}`}>
                            {emp.name}
                          </span>
                          {isCurrent && (
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1 rounded font-bold uppercase">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {emp.role.replace("_", " ")} · {emp.department}
                        </div>
                      </td>
                      <td className="p-3 text-center text-xs font-semibold text-slate-700">
                        {emp.badgesCount > 0 ? `🏅 ${emp.badgesCount}` : "-"}
                      </td>
                      <td className="p-3 text-right">
                        <span className="font-bold text-slate-900">{emp.xp}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* DEPARTMENT STANDINGS */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Department Standings</h3>
            <p className="text-xs text-slate-500">Ranked by aggregate XP of all department members.</p>
          </div>

          <div className="space-y-4">
            {data.departments.map((dept, index) => {
              const rank = index + 1;
              const widthPct = maxDeptXp > 0 ? Math.round((dept.totalXp / maxDeptXp) * 100) : 0;
              const isUserDept = currentUser?.department?.id === dept.id;

              return (
                <div
                  key={dept.id}
                  className={`p-3 rounded-lg border flex items-center space-x-4 transition ${
                    isUserDept
                      ? "border-emerald-500/20 bg-emerald-50/10"
                      : "border-slate-100 bg-stone-50/40"
                  }`}
                >
                  <div className="shrink-0 w-8 text-center">{getRankBadge(rank)}</div>

                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-semibold text-slate-800 text-sm truncate">{dept.name}</span>
                        <span className="text-[10px] text-slate-400">({dept.memberCount} members)</span>
                        {isUserDept && (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1 rounded font-bold uppercase">
                            My Dept
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-slate-900 whitespace-nowrap">{dept.totalXp} XP</span>
                    </div>

                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
