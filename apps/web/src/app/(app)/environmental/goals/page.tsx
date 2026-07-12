"use client";

import { useEffect, useState } from "react";
import { getToken, getCurrentUser, type CurrentUser } from "@/lib/auth";

type Goal = {
  id: string;
  name: string;
  targetKgCo2e: string;
  currentKgCo2e: string;
  deadline: string;
  status: "ON_TRACK" | "AT_RISK" | "COMPLETED";
  department: { name: string };
};

export default function EnvironmentalGoalsPage() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const u = await getCurrentUser();
      setUser(u);
      
      const token = getToken();
      if (!token) return;

      try {
        const res = await fetch("http://localhost:4000/api/v1/environmental/goals", {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const body = await res.json();
          setGoals(body.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ON_TRACK": return "bg-emerald-100 text-emerald-800";
      case "AT_RISK": return "bg-amber-100 text-amber-800";
      case "COMPLETED": return "bg-blue-100 text-blue-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace("_", " ");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Environmental Goals</h1>
          <p className="text-sm text-slate-500 mt-1">Track department targets for carbon reduction.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-slate-500">Loading...</div>
      ) : goals.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <h3 className="text-sm font-medium text-slate-900">No goals set</h3>
          <p className="text-sm text-slate-500 mt-1">There are no active environmental goals.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => {
            const current = Number(goal.currentKgCo2e);
            const target = Number(goal.targetKgCo2e);
            const progress = Math.min(100, Math.max(0, (current / target) * 100));
            
            return (
              <div key={goal.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-slate-900">{goal.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{goal.department.name}</p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(goal.status)}`}>
                    {getStatusLabel(goal.status)}
                  </span>
                </div>
                
                <div className="mt-auto pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Current</span>
                    <span className="font-medium text-slate-900">{current.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-xs text-slate-400 font-normal">kg CO₂e</span></span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Target</span>
                    <span className="font-medium text-slate-900">{target.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-xs text-slate-400 font-normal">kg CO₂e</span></span>
                  </div>
                  
                  <div className="relative w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${goal.status === 'AT_RISK' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center pt-2 border-t border-slate-100 mt-2">
                    <span className="text-xs font-medium text-slate-500">{progress.toFixed(1)}%</span>
                    <span className="text-xs text-slate-500">Due {new Date(goal.deadline).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
