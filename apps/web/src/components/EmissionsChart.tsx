"use client";

import { useEffect, useState } from "react";
import { getToken, getCurrentUser, type CurrentUser } from "@/lib/auth";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type ChartDataPoint = {
  name: string;
  [category: string]: number | string;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0]; // shared={false} ensures we only get the hovered item
    return (
      <div className="bg-white/80 backdrop-blur-md p-3 rounded-xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">{label}</p>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: data.color || data.fill }} />
          <span className="font-medium text-slate-700">{data.name}:</span>
          <span className="font-bold text-slate-900">{Number(data.value).toLocaleString()} kg CO₂e</span>
        </div>
      </div>
    );
  }
  return null;
};

export function EmissionsChart() {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [user, setUser] = useState<CurrentUser | null>(null);

  const [timeframe, setTimeframe] = useState<"3M" | "6M" | "ALL">("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError("");

      const u = await getCurrentUser();
      setUser(u);

      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("http://localhost:4000/api/v1/environmental/summary", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          setError("Failed to fetch summary data");
          return;
        }

        const body = await res.json();
        const chartData: ChartDataPoint[] = body.data?.monthlyTrend || [];
        setData(chartData);

        const allKeys = new Set<string>();
        chartData.forEach((item) => {
          Object.keys(item).forEach((key) => {
            if (key !== "name") {
              allKeys.add(key);
            }
          });
        });
        setCategories(Array.from(allKeys));
      } catch (err) {
        console.error(err);
        setError("An unexpected error occurred while loading chart data");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="w-full h-80 flex items-center justify-center bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500 font-medium">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-80 flex items-center justify-center bg-white rounded-2xl shadow-sm border border-slate-100">
        <p className="text-sm font-medium text-red-500 bg-red-50 px-4 py-2 rounded-lg">{error}</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full h-80 flex flex-col items-center justify-center bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="text-slate-300 mb-3">
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-500">No data available for charting</p>
      </div>
    );
  }

  // Modern vibrant gradients
  const colors = [
    { start: "#34d399", end: "#059669" }, // Emerald
    { start: "#60a5fa", end: "#2563eb" }, // Blue
    { start: "#fbbf24", end: "#d97706" }, // Amber
    { start: "#a78bfa", end: "#7c3aed" }, // Violet
    { start: "#f472b6", end: "#db2777" }, // Pink
  ];

  // Filter by timeframe
  const filteredData = data.filter((item) => {
    if (timeframe === "ALL") return true;
    
    // Parse "YYYY-MM"
    const [year, month] = item.name.split("-").map(Number);
    const itemDate = new Date(year, month - 1);
    
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - (timeframe === "3M" ? 3 : 6));
    
    return itemDate >= cutoffDate;
  });

  // Filter categories
  const activeCategories = selectedCategory === "ALL" 
    ? categories 
    : categories.filter(c => c === selectedCategory);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 w-full transition-all hover:shadow-md duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">Emissions Trend</h3>
          <p className="text-sm text-slate-500 mt-0.5 font-medium">Monthly breakdown by category (kg CO₂e)</p>
        </div>
        <div className="flex gap-3">
          <select 
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50 hover:bg-slate-100 transition-colors"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="ALL">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select 
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50 hover:bg-slate-100 transition-colors"
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as any)}
          >
            <option value="ALL">All Time</option>
            <option value="6M">Last 6 Months</option>
            <option value="3M">Last 3 Months</option>
          </select>
        </div>
      </div>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={filteredData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            barSize={32}
            barGap={4}
          >
            <defs>
              {categories.map((cat, idx) => {
                const color = colors[idx % colors.length];
                return (
                  <linearGradient key={`grad-${cat}`} id={`color-${idx}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color.start} stopOpacity={1} />
                    <stop offset="100%" stopColor={color.end} stopOpacity={1} />
                  </linearGradient>
                );
              })}
            </defs>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12, fill: "#94a3b8", fontWeight: 500 }} 
              axisLine={false} 
              tickLine={false} 
              dy={10}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: "#94a3b8", fontWeight: 500 }} 
              axisLine={false} 
              tickLine={false} 
              dx={-10}
              tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
            />
            <Tooltip
              shared={false}
              cursor={{ fill: "#f8fafc" }}
              content={<CustomTooltip />}
            />
            <Legend 
              wrapperStyle={{ fontSize: "13px", fontWeight: 500, paddingTop: "20px" }}
              iconType="circle"
              iconSize={8}
            />
            {activeCategories.map((category) => {
              const colorIndex = categories.indexOf(category);
              return (
                <Bar
                  key={category}
                  dataKey={category}
                  fill={`url(#color-${colorIndex})`}
                  radius={[6, 6, 0, 0]}
                  animationDuration={1000}
                  animationEasing="ease-out"
                />
              );
            })}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
