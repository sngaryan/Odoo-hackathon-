"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function GamificationLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const tabs = [
    { href: "/gamification/challenges", label: "Challenges" },
    { href: "/gamification/leaderboard", label: "Leaderboard" },
    { href: "/gamification/badges", label: "Badges Gallery" },
    { href: "/gamification/rewards", label: "Rewards Store" },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-2">
        <div className="flex space-x-6">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`pb-3 text-sm font-semibold transition-all duration-200 border-b-2 ${
                  isActive
                    ? "border-emerald-500 text-emerald-600"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
}
