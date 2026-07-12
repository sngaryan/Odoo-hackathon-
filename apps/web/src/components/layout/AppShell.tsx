"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearToken, getCurrentUser, type CurrentUser } from "@/lib/auth";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/environmental/transactions", label: "Environmental" },
  { href: "/social/activities", label: "Social" },
  { href: "/gamification/challenges", label: "Gamification" },
  { href: "/governance/policies", label: "Governance" },
  { href: "/reports", label: "Reports" },
  { href: "/settings", label: "Settings" },
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

  return (
    <div className="min-h-screen bg-stone-50 text-slate-950">
      <aside className="fixed inset-y-0 left-0 w-64 bg-slate-950 px-4 py-6 text-white">
        <div className="mb-8">
          <div className="text-xl font-semibold">EcoSphere</div>
          <div className="mt-1 text-xs text-slate-400">ESG operations hub</div>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-md px-3 py-2 text-sm transition ${
                  isActive
                    ? "bg-emerald-500 text-slate-950"
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
