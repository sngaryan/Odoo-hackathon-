"use client";

import { useEffect, useState } from "react";
import { getToken, getCurrentUser, type CurrentUser } from "@/lib/auth";
import { EnvironmentalNav } from "@/components/EnvironmentalNav";

type Department = { id: string; name: string };

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
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    departmentId: "",
    targetKgCo2e: "",
    currentKgCo2e: "0",
    deadline: new Date().toISOString().split("T")[0],
    status: "ON_TRACK" as "ON_TRACK" | "AT_RISK" | "COMPLETED",
  });

  useEffect(() => {
    async function loadData() {
      const u = await getCurrentUser();
      setUser(u);
      
      const token = getToken();
      if (!token) return;

      try {
        const [goalsRes, deptRes] = await Promise.all([
          fetch("http://localhost:4000/api/v1/environmental/goals", {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch("http://localhost:4000/api/v1/environmental/departments", {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        if (goalsRes.ok) {
          const body = await goalsRes.json();
          setGoals(body.data);
        }
        if (deptRes.ok) {
          const body = await deptRes.json();
          setDepartments(body.data);
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

  const openAddDrawer = () => {
    setEditingGoal(null);
    setFormError("");
    setFormSuccess(false);
    setFormData({
      name: "",
      departmentId: user?.department?.id || (departments.length > 0 ? departments[0].id : ""),
      targetKgCo2e: "",
      currentKgCo2e: "0",
      deadline: new Date().toISOString().split("T")[0],
      status: "ON_TRACK",
    });
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (goal: Goal) => {
    setEditingGoal(goal);
    setFormError("");
    setFormSuccess(false);
    setFormData({
      name: goal.name,
      departmentId: "",
      targetKgCo2e: goal.targetKgCo2e,
      currentKgCo2e: goal.currentKgCo2e,
      deadline: new Date(goal.deadline).toISOString().split("T")[0],
      status: goal.status,
    });
    setIsDrawerOpen(true);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setFormSuccess(false);
    const token = getToken();
    
    try {
      const url = editingGoal 
        ? `http://localhost:4000/api/v1/environmental/goals/${editingGoal.id}`
        : `http://localhost:4000/api/v1/environmental/goals`;
        
      const method = editingGoal ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          ...(!editingGoal && { departmentId: formData.departmentId }),
          targetKgCo2e: Number(formData.targetKgCo2e),
          ...(editingGoal && { currentKgCo2e: Number(formData.currentKgCo2e) }),
          deadline: new Date(formData.deadline).toISOString(),
          ...(editingGoal && { status: formData.status }),
        })
      });

      const body = await res.json();
      if (!res.ok) {
        setFormError(body.error?.message || "Failed to save goal.");
        return;
      }
      
      if (editingGoal) {
        setGoals(goals.map(g => g.id === editingGoal.id ? { ...g, ...body.data } : g));
      } else {
        const dName = departments.find(d => d.id === formData.departmentId)?.name || user?.department?.name || "";
        setGoals([...goals, { ...body.data, department: { name: dName } }].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()));
      }
      
      setFormSuccess(true);
      setTimeout(() => {
        setIsDrawerOpen(false);
      }, 1000);
      
    } catch (err) {
      setFormError("An unexpected error occurred.");
    }
  }

  const canEdit = user?.role === "ADMIN" || user?.role === "ESG_MANAGER";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Environmental Goals</h1>
          <p className="text-sm text-slate-500 mt-1">Track department targets for carbon reduction.</p>
        </div>
        {canEdit && (
          <button 
            onClick={openAddDrawer}
            className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 shadow-sm transition-colors"
          >
            Add Goal
          </button>
        )}
      </div>
      <EnvironmentalNav />

      {loading ? (
        <div className="text-sm text-slate-500">Loading...</div>
      ) : goals.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="text-emerald-500 mb-3 flex justify-center">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
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
              <div key={goal.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-slate-900">{goal.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{goal.department.name}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(goal.status)}`}>
                      {getStatusLabel(goal.status)}
                    </span>
                    {canEdit && (
                      <button 
                        onClick={() => openEditDrawer(goal)}
                        className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
                      >
                        Edit
                      </button>
                    )}
                  </div>
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

      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)} />
          <div className="absolute inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">{editingGoal ? "Edit Goal" : "Add Goal"}</h2>
              <button onClick={() => setIsDrawerOpen(false)} className="text-slate-400 hover:text-slate-500">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {formError && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-100">
                  {typeof formError === 'string' ? formError : JSON.stringify(formError)}
                </div>
              )}
              {formSuccess && (
                <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 text-sm rounded-md border border-emerald-100">
                  Goal successfully saved.
                </div>
              )}
              
              <form id="goal-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                  {editingGoal ? (
                    <input 
                      type="text" 
                      readOnly 
                      disabled
                      className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500"
                      value={editingGoal.department.name}
                    />
                  ) : (
                    <select
                      required
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      value={formData.departmentId}
                      onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    >
                      <option value="" disabled>Select a department</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Goal Name</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Reduce Office Electricity"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Target (kg CO₂e)</label>
                    <input 
                      type="number" 
                      required 
                      min="1" 
                      step="any"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      value={formData.targetKgCo2e}
                      onChange={(e) => setFormData({ ...formData, targetKgCo2e: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Deadline</label>
                    <input 
                      type="date" 
                      required 
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      value={formData.deadline}
                      onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    />
                  </div>
                </div>

                {editingGoal && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Current (kg CO₂e)</label>
                      <input 
                        type="number" 
                        required 
                        min="0" 
                        step="any"
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        value={formData.currentKgCo2e}
                        onChange={(e) => setFormData({ ...formData, currentKgCo2e: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                      <select 
                        required 
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      >
                        <option value="ON_TRACK">On Track</option>
                        <option value="AT_RISK">At Risk</option>
                        <option value="COMPLETED">Completed</option>
                      </select>
                    </div>
                  </>
                )}
                
                {!editingGoal && (
                  <div className="bg-slate-50 p-3 rounded text-sm text-slate-600 border border-slate-100">
                    New goals start with a current CO₂e of 0. When carbon transactions are logged, this goal will update automatically.
                  </div>
                )}
              </form>
            </div>
            <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setIsDrawerOpen(false)}
                className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors"
                disabled={formSuccess}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="goal-form"
                disabled={formSuccess}
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {editingGoal ? "Save Changes" : "Add Goal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
