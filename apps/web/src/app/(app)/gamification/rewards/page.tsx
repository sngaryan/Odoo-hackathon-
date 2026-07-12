"use client";

import { useEffect, useState } from "react";
import { getToken } from "@/lib/auth";

type Reward = { id: string; name: string; description: string; category: string; xpCost: number; stock: number | null };
type Redemption = { id: string; xpSpent: number; status: string; createdAt: string; rewardItem: Reward };

const categoryLabel: Record<string, string> = {
  COMPANY_PERK: "Company perk",
  CARBON_OFFSET: "Carbon offset",
  TREE_PLANTING: "Tree planting",
};

export default function RewardsPage() {
  const [items, setItems] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [xpBalance, setXpBalance] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    const token = getToken();
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    const [rewardsResponse, historyResponse] = await Promise.all([
      fetch("http://localhost:4000/gamification/rewards", { headers }),
      fetch("http://localhost:4000/gamification/redemptions", { headers }),
    ]);
    const rewardsBody = await rewardsResponse.json();
    const historyBody = await historyResponse.json();
    if (!rewardsResponse.ok) throw new Error(rewardsBody.error?.message ?? "Could not load rewards.");
    setItems(rewardsBody.data.items);
    setXpBalance(rewardsBody.data.xpBalance);
    if (historyResponse.ok) setRedemptions(historyBody.data);
  }

  useEffect(() => { loadData().catch((err) => setError(err.message)); }, []);

  async function redeem(item: Reward) {
    if (!window.confirm(`Redeem ${item.name} for ${item.xpCost} XP?`)) return;
    setBusyId(item.id); setError(null); setMessage(null);
    try {
      const token = getToken();
      const response = await fetch("http://localhost:4000/gamification/rewards/redeem", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ rewardItemId: item.id }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message ?? "Redemption failed.");
      setMessage(`${item.name} redeemed. Your request is now being processed.`);
      await loadData();
    } catch (err: any) { setError(err.message); }
    finally { setBusyId(null); }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-emerald-700 p-6 text-white shadow-sm">
        <p className="text-sm font-semibold text-emerald-100">Rewards Store</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div><h2 className="text-2xl font-bold">Turn sustainable actions into impact.</h2><p className="mt-1 text-sm text-emerald-100">Redeem company perks or fund climate action with your earned XP.</p></div>
          <div className="rounded-xl bg-white/15 px-5 py-3"><p className="text-xs font-semibold uppercase tracking-wide text-emerald-100">Available XP</p><p className="text-2xl font-bold">{xpBalance}</p></div>
        </div>
      </section>
      {error && <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
      {message && <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{message}</div>}
      <section className="grid gap-4 md:grid-cols-3">
        {items.map((item) => {
          const unavailable = item.stock === 0;
          const affordable = xpBalance >= item.xpCost;
          return <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm" key={item.id}>
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">{categoryLabel[item.category] ?? item.category}</p>
            <h3 className="mt-2 text-lg font-bold text-slate-900">{item.name}</h3><p className="mt-2 min-h-12 text-sm text-slate-600">{item.description}</p>
            <div className="mt-5 flex items-center justify-between"><span className="font-bold text-slate-900">{item.xpCost} XP</span><span className="text-xs text-slate-500">{item.stock === null ? "Always available" : `${item.stock} left`}</span></div>
            <button className="mt-4 w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300" disabled={!affordable || unavailable || busyId === item.id} onClick={() => redeem(item)} type="button">
              {busyId === item.id ? "Redeeming…" : unavailable ? "Out of stock" : affordable ? "Redeem reward" : "Need more XP"}
            </button>
          </article>;
        })}
      </section>
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="text-lg font-bold text-slate-900">Your redemption history</h3>
        {redemptions.length === 0 ? <p className="mt-3 text-sm text-slate-500">No rewards redeemed yet.</p> : <ul className="mt-3 divide-y divide-slate-100">{redemptions.map((entry) => <li className="flex items-center justify-between py-3 text-sm" key={entry.id}><span><strong className="text-slate-900">{entry.rewardItem.name}</strong><span className="ml-2 text-slate-500">{new Date(entry.createdAt).toLocaleDateString()}</span></span><span className="font-semibold text-emerald-700">-{entry.xpSpent} XP · {entry.status}</span></li>)}</ul>}
      </section>
    </div>
  );
}
