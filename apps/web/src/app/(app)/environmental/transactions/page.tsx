"use client";

import { useEffect, useState } from "react";
import { getToken, getCurrentUser, type CurrentUser } from "@/lib/auth";
import { EnvironmentalNav } from "@/components/EnvironmentalNav";

type Factor = { id: string; name: string; unit: string; factorKgCo2e: string; active: boolean };
type Transaction = {
  id: string;
  source: string;
  description: string;
  quantity: string;
  calculatedKgCo2e: string;
  occurredOn: string;
  emissionFactor: Factor;
  department: { name: string };
  createdBy: { name: string };
};

export default function EnvironmentalTransactionsPage() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [factors, setFactors] = useState<Factor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [formError, setFormError] = useState("");
  
  const [formData, setFormData] = useState({
    factorId: "",
    source: "",
    description: "",
    quantity: "",
    occurredOn: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    async function loadData() {
      const u = await getCurrentUser();
      setUser(u);
      
      const token = getToken();
      if (!token) return;

      try {
        const [txRes, factorRes] = await Promise.all([
          fetch("http://localhost:4000/api/v1/environmental/transactions", {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch("http://localhost:4000/api/v1/environmental/factors", {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        if (txRes.ok && factorRes.ok) {
          const txBody = await txRes.json();
          const factorBody = await factorRes.json();
          setTransactions(txBody.data);
          setFactors(factorBody.data.filter((f: Factor) => f.active));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalCO2e = transactions.reduce((sum, tx) => sum + Number(tx.calculatedKgCo2e), 0);
  
  const selectedFactor = factors.find(f => f.id === formData.factorId);
  const livePreview = selectedFactor && formData.quantity 
    ? (Number(selectedFactor.factorKgCo2e) * Number(formData.quantity)).toFixed(2)
    : "0.00";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    const token = getToken();
    
    try {
      const res = await fetch("http://localhost:4000/api/v1/environmental/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          quantity: Number(formData.quantity),
          occurredOn: new Date(formData.occurredOn).toISOString(),
        })
      });

      const body = await res.json();
      if (!res.ok) {
        setFormError(body.error?.message || "Failed to save transaction.");
        return;
      }
      
      setTransactions([body.data, ...transactions]);
      setIsDrawerOpen(false);
      setFormData({ factorId: "", source: "", description: "", quantity: "", occurredOn: new Date().toISOString().split("T")[0] });
    } catch (err) {
      setFormError("An unexpected error occurred.");
    }
  }

  const canEdit = user?.role === "ADMIN" || user?.role === "ESG_MANAGER";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Carbon Transactions</h1>
          <p className="text-sm text-slate-500 mt-1">Track and manage your organization's carbon footprint.</p>
        </div>
        {canEdit && (
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 shadow-sm transition-colors"
          >
            Log Carbon Data
          </button>
        )}
      </div>
      <EnvironmentalNav />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <p className="text-sm font-medium text-slate-500">Total Emissions</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-slate-900">{totalCO2e.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            <span className="text-sm text-slate-500">kg CO₂e</span>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <p className="text-sm font-medium text-slate-500">Total Records</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-slate-900">{transactions.length}</span>
            <span className="text-sm text-slate-500">entries</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading...</div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-emerald-500 mb-3 flex justify-center">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
            </div>
            <h3 className="text-sm font-medium text-slate-900">No transactions yet</h3>
            <p className="text-sm text-slate-500 mt-1">Get started by logging your first carbon data.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-slate-500">Date</th>
                  <th className="px-6 py-3 text-left font-medium text-slate-500">Source</th>
                  <th className="px-6 py-3 text-left font-medium text-slate-500">Category</th>
                  <th className="px-6 py-3 text-left font-medium text-slate-500">Department</th>
                  <th className="px-6 py-3 text-right font-medium text-slate-500">Quantity</th>
                  <th className="px-6 py-3 text-right font-medium text-slate-500">CO₂e (kg)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      {new Date(tx.occurredOn).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{tx.source}</div>
                      <div className="text-slate-500 text-xs mt-0.5">{tx.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                        {tx.emissionFactor.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      {tx.department.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600 text-right">
                      {Number(tx.quantity).toLocaleString()} <span className="text-xs text-slate-400">{tx.emissionFactor.unit}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-900 font-medium text-right">
                      {Number(tx.calculatedKgCo2e).toLocaleString(undefined, { maximumFractionDigits: 2 })}
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
              <h2 className="text-lg font-semibold text-slate-900">Log Carbon Data</h2>
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
              <form id="tx-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Emission Factor</label>
                  <select 
                    required 
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    value={formData.factorId}
                    onChange={(e) => setFormData({ ...formData, factorId: e.target.value })}
                  >
                    <option value="" disabled>Select a category...</option>
                    {factors.map(f => (
                      <option key={f.id} value={f.id}>{f.name} ({f.factorKgCo2e} kg/CO₂e per {f.unit})</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Source Name</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Fleet Vehicle A"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea 
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    rows={2}
                    placeholder="Optional details"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Quantity {selectedFactor && <span className="text-slate-500 font-normal">({selectedFactor.unit})</span>}
                    </label>
                    <input 
                      type="number" 
                      required 
                      min="0.01" 
                      step="any"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                    <input 
                      type="date" 
                      required 
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      value={formData.occurredOn}
                      onChange={(e) => setFormData({ ...formData, occurredOn: e.target.value })}
                    />
                  </div>
                </div>

                <div className="mt-6 bg-slate-50 p-4 rounded-lg border border-slate-100 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Calculated Impact</span>
                  <div className="text-right">
                    <span className="text-xl font-semibold text-emerald-600">{livePreview}</span>
                    <span className="text-xs text-slate-500 ml-1">kg CO₂e</span>
                  </div>
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
                form="tx-form"
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
              >
                Save Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
