"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import Link from "next/link";

type Overview = {
  esgScore: {
    overall: number;
    environmental: number;
    social: number;
    governance: number;
  };
  kpis: {
    activePolicies: number;
    acknowledgedPolicies: number;
    openIssues: number;
    completedAudits: number;
    co2e: number;
    deptCo2e: number;
    userXp: number;
    deptRank: number;
    activeChallengeXp: number;
    activeChallengeTitle: string;
  };
  riskList: { id: string; title: string; severity: string; status: string }[];
};

const demoOverview: Overview = {
  esgScore: { overall: 84, environmental: 86, social: 75, governance: 92 },
  kpis: {
    activePolicies: 18,
    acknowledgedPolicies: 146,
    openIssues: 7,
    completedAudits: 24,
    co2e: 45210,
    deptCo2e: 12450,
    userXp: 250,
    deptRank: 1,
    activeChallengeXp: 150,
    activeChallengeTitle: "Car-Free Commute Week"
  },
  riskList: [
    { id: "demo-1", title: "Supplier evidence renewal due in 8 days", severity: "HIGH", status: "IN_PROGRESS" },
    { id: "demo-2", title: "Travel-emissions variance requires review", severity: "MEDIUM", status: "OPEN" },
  ],
};

const monthlyControlHealth = [62, 68, 71, 76, 74, 82, 86, 89, 91, 88, 94, 96];

export default function DashboardPage() {
  const [overview, setOverview] = useState<Overview>(demoOverview);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    apiRequest<{ data: Overview }>("/dashboard/overview", { signal: controller.signal })
      .then((response) => response.json())
      .then((body) => {
        if (body.data) {
          setOverview(body.data);
          setIsLive(true);
        }
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setMessage("Showing prepared demo data while the live ESG feed reconnects.");
        }
      })
      .finally(() => setIsLoading(false));
    return () => controller.abort();
  }, []);

  const kpis = [["Active policies", overview.kpis.activePolicies, "+3 this quarter", "Policies"], ["Open compliance issues", overview.kpis.openIssues, "2 high priority", "Compliance"], ["Completed audits", overview.kpis.completedAudits, "+18% completion", "Assurance"], ["Policy acknowledgements", overview.kpis.acknowledgedPolicies, "94% organisation-wide", "Adoption"]];

  return <section className="max-w-7xl"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium text-emerald-700">Executive governance</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Governance command centre</h1><p className="mt-3 text-slate-600">Policies, assurance, compliance risk, and reporting readiness in one view.</p></div><span className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ${isLive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{isLoading ? "Refreshing…" : isLive ? "Live governance data" : "Demo-ready preview"}</span></div>{message && <p className="mt-5 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">{message}</p>}<div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{kpis.map(([label, value, note, category], index) => <article key={label} style={{ animationDelay: `${index * 70}ms` }} className="animate-in fade-in slide-in-from-bottom-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md"><div className="flex items-center justify-between"><p className="text-sm text-slate-500">{label}</p><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">{category}</span></div><p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">{value}</p><p className="mt-2 text-xs font-medium text-emerald-700">{note}</p></article>)}</div><div className="mt-6 grid gap-6 lg:grid-cols-5"><article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-3"><div className="flex items-start justify-between"><div><h2 className="font-semibold">Control health trend</h2><p className="mt-1 text-sm text-slate-500">Monthly assurance score · trailing 12 months</p></div><span className="text-sm font-semibold text-emerald-700">96%</span></div><div className="mt-8 flex h-36 items-end gap-1.5">{monthlyControlHealth.map((value, index) => <div key={`${value}-${index}`} className="group flex h-full flex-1 items-end"><div title={`${value}%`} style={{ height: `${value}%`, animationDelay: `${index * 55}ms` }} className="animate-in fade-in slide-in-from-bottom-4 w-full rounded-t bg-emerald-500 transition duration-200 group-hover:bg-emerald-700" /></div>)}</div><div className="mt-3 flex justify-between text-xs text-slate-400"><span>Aug ’25</span><span>Jul ’26</span></div></article><article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2"><h2 className="font-semibold">Reporting readiness</h2><p className="mt-1 text-sm text-slate-500">A downloadable CSV is available for each governance view.</p><div className="mt-6 space-y-4">{[["Governance overview", "Ready"], ["Compliance register", "Ready"], ["Audit register", "Ready"]].map(([label, state]) => <div key={label} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0"><span className="text-sm font-medium">{label}</span><span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">{state}</span></div>)}</div></article></div><section className="mt-6"><div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Priority risk queue</h2><span className="text-sm text-slate-500">{overview.riskList.length} items requiring attention</span></div><div className="grid gap-3 md:grid-cols-2">{overview.riskList.map((risk) => <article key={risk.id} className="rounded-xl border border-amber-200 bg-amber-50 p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-sm"><p className="font-semibold text-amber-950">{risk.title}</p><p className="mt-2 text-sm text-amber-900">{risk.severity} severity · {risk.status.replaceAll("_", " ")}</p></article>)}</div></section></section>;
  return (
    <section className="max-w-7xl space-y-6 text-slate-900">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-700">Executive command dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">ESG Performance & Operations</h1>
          <p className="mt-1 text-slate-600 text-sm">Cross-pillar ESG index, carbon monitoring, compliance registry, and gamified engagement status.</p>
        </div>
        <span className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ${isLive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
          {isLoading ? "Refreshing…" : isLive ? "Live ESG data" : "Demo-ready preview"}
        </span>
      </div>

      {message && (
        <p className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          {message}
        </p>
      )}

      {/* Main ESG Score Grid */}
      <div className="grid gap-6 md:grid-cols-4">
        {/* Overall Index Gauge */}
        <div className="bg-slate-950 text-white rounded-2xl p-6 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 rounded-full bg-emerald-500/10 blur-xl"></div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">ESG Index Score</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-full">Overall</span>
            </div>
            <div className="mt-6 flex items-baseline gap-2">
              <span className="text-5xl font-bold tracking-tight">{overview.esgScore.overall}%</span>
              <span className="text-xs text-emerald-400 font-medium">On track</span>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-400">Weighted scorecard: 40% Env, 30% Soc, 30% Gov.</p>
        </div>

        {/* Environmental Score */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:border-emerald-200 transition duration-200">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Environmental</span>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">E-Pillar</span>
            </div>
            <div className="mt-6 flex items-baseline gap-2">
              <span className="text-5xl font-bold tracking-tight text-slate-900">{overview.esgScore.environmental}%</span>
              <span className="text-xs text-emerald-600 font-medium">Goal progress</span>
            </div>
          </div>
          <div className="mt-4 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${overview.esgScore.environmental}%` }}></div>
          </div>
        </div>

        {/* Social Score */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:border-sky-200 transition duration-200">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Social & Gamification</span>
              <span className="text-[10px] bg-sky-50 text-sky-700 font-semibold px-2 py-0.5 rounded-full">S-Pillar</span>
            </div>
            <div className="mt-6 flex items-baseline gap-2">
              <span className="text-5xl font-bold tracking-tight text-slate-900">{overview.esgScore.social}%</span>
              <span className="text-xs text-sky-600 font-medium">CSR engagement</span>
            </div>
          </div>
          <div className="mt-4 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-sky-500 h-full rounded-full transition-all duration-500" style={{ width: `${overview.esgScore.social}%` }}></div>
          </div>
        </div>

        {/* Governance Score */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:border-indigo-200 transition duration-200">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Governance & Trust</span>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">G-Pillar</span>
            </div>
            <div className="mt-6 flex items-baseline gap-2">
              <span className="text-5xl font-bold tracking-tight text-slate-900">{overview.esgScore.governance}%</span>
              <span className="text-xs text-indigo-600 font-medium">Assurance rating</span>
            </div>
          </div>
          <div className="mt-4 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${overview.esgScore.governance}%` }}></div>
          </div>
        </div>
      </div>

      {/* KPI Detail Cards Row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* CO2e KPI */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Carbon Logged</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">{overview.kpis.co2e.toLocaleString()} kg CO₂e</p>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-slate-500">Dept total: {overview.kpis.deptCo2e.toLocaleString()} kg</span>
            <Link href="/environmental/transactions" className="text-emerald-700 font-medium hover:underline">Log emissions →</Link>
          </div>
        </div>

        {/* User standing (XP/Rank) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">My Gamification Status</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">{overview.kpis.userXp} XP</p>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-slate-500">Department rank: #{overview.kpis.deptRank}</span>
            <Link href="/gamification/leaderboard" className="text-amber-700 font-medium hover:underline">Leaderboard →</Link>
          </div>
        </div>

        {/* Compliance issues */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Compliance Registry</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">{overview.kpis.openIssues} Open Issues</p>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-slate-500">{overview.kpis.completedAudits} audits completed</span>
            <Link href="/governance/policies" className="text-indigo-700 font-medium hover:underline">Audit issues →</Link>
          </div>
        </div>

        {/* Policies acknowledgements */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Policy Acknowledgements</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">{overview.kpis.acknowledgedPolicies}</p>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-slate-500">{overview.kpis.activePolicies} active regulatory rules</span>
            <Link href="/governance/policies" className="text-indigo-700 font-medium hover:underline">Review rules →</Link>
          </div>
        </div>
      </div>

      {/* Gamification Challenge Banner */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider bg-amber-100 px-2 py-0.5 rounded-full">Active Green Challenge</span>
          <h3 className="mt-1 font-semibold text-slate-900 text-lg">{overview.kpis.activeChallengeTitle}</h3>
          <p className="text-sm text-slate-600">Join other employees and upload evidence of your green habits to claim massive XP and badges.</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg">+{overview.kpis.activeChallengeXp} XP</span>
          <Link href="/gamification/challenges" className="bg-amber-600 hover:bg-amber-500 text-white font-medium px-4 py-1.5 text-sm rounded-lg shadow-sm transition">
            Join Challenge
          </Link>
        </div>
      </div>

      {/* Control health and reporting details */}
      <div className="grid gap-6 lg:grid-cols-5">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-3">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">Control health trend</h2>
              <p className="mt-1 text-sm text-slate-500">Monthly assurance score · trailing 12 months</p>
            </div>
            <span className="text-sm font-semibold text-emerald-700">96%</span>
          </div>
          <div className="mt-8 flex h-36 items-end gap-1.5">
            {monthlyControlHealth.map((value, index) => (
              <div key={`${value}-${index}`} className="group flex h-full flex-1 items-end">
                <div
                  title={`${value}%`}
                  style={{ height: `${value}%`, animationDelay: `${index * 55}ms` }}
                  className="animate-in fade-in slide-in-from-bottom-4 w-full rounded-t bg-emerald-500 transition duration-200 group-hover:bg-emerald-700"
                />
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between text-xs text-slate-400">
            <span>Aug ’25</span>
            <span>Jul ’26</span>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="font-semibold text-slate-900">Reporting readiness</h2>
          <p className="mt-1 text-sm text-slate-500">A downloadable CSV is available for each governance view.</p>
          <div className="mt-6 space-y-4">
            {[["Governance overview", "Ready"], ["Compliance register", "Ready"], ["Audit register", "Ready"]].map(([label, state]) => (
              <div key={label} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0">
                <span className="text-sm font-medium text-slate-800">{label}</span>
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">{state}</span>
              </div>
            ))}
          </div>
        </article>
      </div>

      {/* Priority Risk Queue */}
      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Priority risk queue</h2>
          <span className="text-sm text-slate-500">{overview.riskList.length} items requiring attention</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {overview.riskList.map((risk) => (
            <article key={risk.id} className="rounded-xl border border-amber-200 bg-amber-50 p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-sm">
              <p className="font-semibold text-amber-950">{risk.title}</p>
              <p className="mt-2 text-sm text-amber-900">{risk.severity} severity · {risk.status.replaceAll("_", " ")}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
