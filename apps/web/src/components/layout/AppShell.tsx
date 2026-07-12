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

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
  category: string;
  colorClass: string;
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "ESG_MANAGER", "EMPLOYEE", "AUDITOR"], category: "/dashboard", colorClass: "bg-emerald-600 text-white font-medium" },
  { href: "/environmental/transactions", label: "Environmental", icon: Leaf, roles: ["ADMIN", "ESG_MANAGER", "EMPLOYEE"], category: "/environmental", colorClass: "bg-emerald-600 text-white font-medium" },
  { href: "/social/activities", label: "Social", icon: Users, roles: ["ADMIN", "EMPLOYEE"], category: "/social", colorClass: "bg-sky-600 text-white font-medium" },
  { href: "/gamification/challenges", label: "Gamification", icon: Trophy, roles: ["ADMIN", "ESG_MANAGER", "EMPLOYEE"], category: "/gamification", colorClass: "bg-amber-600 text-white font-medium" },
  { href: "/governance/policies", label: "Governance", icon: Shield, roles: ["ADMIN", "AUDITOR", "EMPLOYEE"], category: "/governance", colorClass: "bg-indigo-600 text-white font-medium" },
  { href: "/reports", label: "Reports", icon: BarChart3, roles: ["ADMIN", "ESG_MANAGER", "AUDITOR"], category: "/reports", colorClass: "bg-purple-600 text-white font-medium" },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["ADMIN", "ESG_MANAGER", "AUDITOR", "EMPLOYEE"], category: "/settings", colorClass: "bg-slate-700 text-white font-medium" },
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

  const userRole = user?.role ?? "EMPLOYEE";
  const matchedNavItem = navItems.find((item) => pathname.startsWith(item.category));
  const isAllowed = matchedNavItem ? matchedNavItem.roles.includes(userRole) : true;

  if (!isAllowed) {
    return (
      <div className="min-h-screen bg-stone-50 text-slate-950 flex">
        <aside className="w-64 bg-slate-950 px-4 py-6 text-white flex flex-col justify-between">
          <div>
            <div className="mb-8">
              <div className="text-xl font-semibold">EcoSphere</div>
              <div className="mt-1 text-xs text-slate-400">ESG operations hub</div>
            </div>
            <nav className="space-y-1">
              {navItems
                .filter((item) => item.roles.includes(userRole))
                .map((item) => {
                  const isActive = pathname.startsWith(item.category);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`block rounded-md px-3 py-2 text-sm transition ${
                        isActive
                          ? item.colorClass
                          : "text-slate-200 hover:bg-slate-800"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
            </nav>
          </div>
        </aside>

        <main className="flex-1 flex flex-col pl-0">
          <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4">
            <div>
              <p className="text-sm font-medium text-slate-950">{user?.name}</p>
              <p className="text-xs text-slate-500">
                {user?.role} · {user?.department?.name ?? "No department"}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              type="button"
            >
              Logout
            </button>
          </header>

          <div className="flex-1 flex items-center justify-center p-8">
            <div className="max-w-md w-full text-center bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600 mb-4">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Access Denied</h2>
              <p className="mt-2 text-sm text-slate-600">
                Your role as <span className="font-semibold text-slate-800">{userRole}</span> does not have permission to view the <span className="font-mono text-slate-700">{pathname}</span> workspace.
              </p>
              <div className="mt-6">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-slate-950 hover:bg-slate-800"
                >
                  Return to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </main>
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
            {navItems
              .filter((item) => item.roles.includes(userRole))
              .map((item) => {
                const isActive = pathname.startsWith(item.category);

                return (
                  <div key={item.href} className="relative group">
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 rounded-xl transition-all duration-200 cursor-pointer ${
                        isCollapsed ? "justify-center p-3" : "px-4 py-3"
                      } ${
                        isActive
                          ? `${item.colorClass} shadow-md shadow-emerald-500/10`
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
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 border border-slate-800 text-sm font-bold text-white select-none cursor-pointer">
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
