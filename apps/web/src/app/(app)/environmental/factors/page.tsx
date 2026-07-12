"use client";

import { useEffect, useState } from "react";
import { getToken, getCurrentUser, type CurrentUser } from "@/lib/auth";

type Factor = {
  id: string;
  name: string;
  category: string;
  unit: string;
  factorKgCo2e: string;
  active: boolean;
};

export default function EnvironmentalFactorsPage() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [factors, setFactors] = useState<Factor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [formError, setFormError] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    category: "Fuel",
    unit: "L",
    factorKgCo2e: "",
    active: true,
  });

  useEffect(() => {
    async function loadData() {
      const u = await getCurrentUser();
      setUser(u);
      
      const token = getToken();
      if (!token) return;

      try {
        const res = await fetch("http://localhost:4000/api/v1/environmental/factors", {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const body = await res.json();
          setFactors(body.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    const token = getToken();
    
    try {
      const res = await fetch("http://localhost:4000/api/v1/environmental/factors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          factorKgCo2e: Number(formData.factorKgCo2e),
        })
      });

      const body = await res.json();
      if (!res.ok) {
        setFormError(body.error?.message || "Failed to create emission factor.");
        return;
      }
      
      setFactors([...factors, body.data].sort((a, b) => a.name.localeCompare(b.name)));
      setIsDrawerOpen(false);
      setFormData({ name: "", category: "Fuel", unit: "L", factorKgCo2e: "", active: true });
    } catch (err) {
      setFormError("An unexpected error occurred.");
    }
  }

  const canEdit = user?.role === "ADMIN" || user?.role === "ESG_MANAGER";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Emission Factors</h1>
          <p className="text-sm text-slate-500 mt-1">Reference values used to calculate CO₂e footprint.</p>
        </div>
        {canEdit && (
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 shadow-sm transition-colors"
          >
            Add Factor
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading...</div>
        ) : factors.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-emerald-500 mb-3 flex justify-center">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
            </div>
            <h3 className="text-sm font-medium text-slate-900">No factors defined</h3>
            <p className="text-sm text-slate-500 mt-1">Add emission factors to enable calculations.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-slate-500">Name</th>
                  <th className="px-6 py-3 text-left font-medium text-slate-500">Category</th>
                  <th className="px-6 py-3 text-left font-medium text-slate-500">Factor Value</th>
                  <th className="px-6 py-3 text-right font-medium text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {factors.map((factor) => (
                  <tr key={factor.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-slate-900">{factor.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      {factor.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      <span className="font-medium">{factor.factorKgCo2e}</span> kg CO₂e / {factor.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {factor.active ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">Active</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">Inactive</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)} />
          <div className="absolute inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Add Emission Factor</h2>
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
              <form id="factor-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Factor Name</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Natural Gas"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                    <select 
                      required 
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="Fuel">Fuel</option>
                      <option value="Energy">Energy</option>
                      <option value="Travel">Travel</option>
                      <option value="Waste">Waste</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. L, kWh, km"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Conversion Value (kg CO₂e per unit)
                  </label>
                  <input 
                    type="number" 
                    required 
                    min="0" 
                    step="any"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    value={formData.factorKgCo2e}
                    onChange={(e) => setFormData({ ...formData, factorKgCo2e: e.target.value })}
                  />
                </div>
              </form>
            </div>
            <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setIsDrawerOpen(false)}
                className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="factor-form"
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
              >
                Add Factor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
