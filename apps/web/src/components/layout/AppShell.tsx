"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearToken, getCurrentUser, type CurrentUser } from "@/lib/auth";
import {
  LayoutDashboard,
  Leaf,
  Users,
  Trophy,
  Shield,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/environmental/transactions", label: "Environmental", icon: Leaf },
  { href: "/social/activities", label: "Social", icon: Users },
  { href: "/gamification/challenges", label: "Gamification", icon: Trophy },
  { href: "/governance/policies", label: "Governance", icon: Shield },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    getCurrentUser().then((currentUser) => {
      if (!currentUser) {
        router.replace("/login");
        return;
      }

      setUser(currentUser);
      setIsLoading(false);
    });

    const stored = localStorage.getItem("sidebar-collapsed");
    if (stored !== null) {
      Promise.resolve().then(() => {
        setIsCollapsed(stored === "true");
      });
    }
  }, [router]);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    const parts = name.split(" ");
    return parts.map((p) => p[0]).join("").toUpperCase().slice(0, 2);
  };

  function handleLogout() {
    clearToken();
    router.replace("/login");
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 text-slate-600">
        Loading workspace...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-slate-950 transition-colors duration-200">
      {/* Collapsible Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 bg-slate-950 py-6 text-white transition-all duration-300 flex flex-col justify-between z-40 border-r border-slate-900 ${
          isCollapsed ? "w-20 px-2.5" : "w-64 px-4"
        }`}
      >
        {/* Collapse Button */}
        <button
          onClick={toggleCollapse}
          className="absolute top-7 -right-3.5 flex h-7 w-7 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-300 hover:text-white transition shadow-lg hover:shadow-xl z-50 cursor-pointer"
          type="button"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>

        {/* Top Branding Section */}
        <div>
          <div className="mb-8 relative flex items-center justify-between">
            {!isCollapsed ? (
              <div className="px-2 transition-all duration-300">
                <div className="text-xl font-bold tracking-tight text-white">EcoSphere</div>
                <div className="mt-0.5 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                  ESG Operations Hub
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center w-full transition-all duration-300">
                <div className="text-xl font-extrabold text-emerald-500 tracking-tight" title="EcoSphere">
                  ES
                </div>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <div key={item.href} className="relative group">
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-xl transition-all duration-200 cursor-pointer ${
                      isCollapsed ? "justify-center p-3" : "px-4 py-3"
                    } ${
                      isActive
                        ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/10"
                        : "text-slate-300 hover:text-white hover:bg-slate-900 font-semibold"
                    }`}
                  >
                    <item.icon
                      className={`h-5 w-5 shrink-0 transition-colors ${
                        isActive
                          ? "text-slate-950"
                          : "text-slate-400 group-hover:text-slate-200"
                      }`}
                    />
                    {!isCollapsed && <span className="text-sm">{item.label}</span>}
                  </Link>

                  {/* Hover Tooltip when Collapsed */}
                  {isCollapsed && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3.5 px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold whitespace-nowrap opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 pointer-events-none shadow-xl z-50 ring-1 ring-slate-800">
                      {item.label}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Avatar Section */}
        <div className="border-t border-slate-900 pt-4 px-2">
          {!isCollapsed ? (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-sm font-bold text-white select-none">
                {getInitials(user?.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-white">{user?.name}</p>
                <p className="truncate text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
                  {user?.role?.replaceAll("_", " ")}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center group relative">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-sm font-bold text-white select-none cursor-pointer">
                {getInitials(user?.name)}
              </div>
              
              {/* Tooltip for User Initials */}
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3.5 px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold whitespace-nowrap opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 pointer-events-none shadow-xl z-50 ring-1 ring-slate-800">
                <p className="font-bold">{user?.name}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{user?.role?.replaceAll("_", " ")}</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main
        className={`transition-all duration-300 min-h-screen ${
          isCollapsed ? "pl-20" : "pl-64"
        }`}
      >
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4 sticky top-0 z-30 shadow-sm">
          <div>
            <p className="text-sm font-semibold text-slate-950">{user?.name}</p>
            <p className="text-xs font-medium text-slate-500">
              {user?.role?.replaceAll("_", " ")} · {user?.department?.name ?? "No department"}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-sm hover:border-slate-400"
            type="button"
          >
            Logout
          </button>
        </header>

        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
