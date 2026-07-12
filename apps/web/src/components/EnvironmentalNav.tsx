"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function EnvironmentalNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Carbon Transactions", path: "/environmental/transactions" },
    { name: "Emission Factors", path: "/environmental/factors" },
    { name: "Goals", path: "/environmental/goals" },
  ];

  return (
    <nav className="flex space-x-8 border-b border-slate-200 mb-6 -mt-2">
      {navItems.map((item) => {
        const isActive = pathname === item.path;
        return (
          <Link
            key={item.name}
            href={item.path}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              isActive
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}
