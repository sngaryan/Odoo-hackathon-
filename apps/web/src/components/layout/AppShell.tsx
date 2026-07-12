"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearToken, getCurrentUser, type CurrentUser } from "@/lib/auth";

const navItems = [
  { href: "/dashboard", label: "Dashboard", roles: ["ADMIN", "ESG_MANAGER", "EMPLOYEE", "AUDITOR"], category: "/dashboard", colorClass: "bg-emerald-600 text-white font-medium" },
  { href: "/environmental/transactions", label: "Environmental", roles: ["ADMIN", "ESG_MANAGER", "EMPLOYEE"], category: "/environmental", colorClass: "bg-emerald-600 text-white font-medium" },
  { href: "/social/activities", label: "Social", roles: ["ADMIN", "EMPLOYEE"], category: "/social", colorClass: "bg-sky-600 text-white font-medium" },
  { href: "/gamification/challenges", label: "Gamification", roles: ["ADMIN", "ESG_MANAGER", "EMPLOYEE"], category: "/gamification", colorClass: "bg-amber-600 text-white font-medium" },
  { href: "/governance/policies", label: "Governance", roles: ["ADMIN", "AUDITOR", "EMPLOYEE"], category: "/governance", colorClass: "bg-indigo-600 text-white font-medium" },
  { href: "/reports", label: "Reports", roles: ["ADMIN", "ESG_MANAGER", "AUDITOR"], category: "/reports", colorClass: "bg-purple-600 text-white font-medium" },
  { href: "/settings", label: "Settings", roles: ["ADMIN", "ESG_MANAGER", "AUDITOR", "EMPLOYEE"], category: "/settings", colorClass: "bg-slate-700 text-white font-medium" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getCurrentUser().then((currentUser) => {
      if (!currentUser) {
        router.replace("/login");
        return;
      }

      setUser(currentUser);
      setIsLoading(false);
    });
  }, [router]);

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
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-slate-900 hover:bg-slate-800"
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
    <div className="min-h-screen bg-stone-50 text-slate-950">
      <aside className="fixed inset-y-0 left-0 w-64 bg-slate-950 px-4 py-6 text-white">
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
      </aside>

      <main className="pl-64">
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

        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
