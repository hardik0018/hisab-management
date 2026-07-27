"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Plus,
  History,
  Repeat,
  BarChart3,
  Settings2,
  Receipt,
  LayoutDashboard,
} from "lucide-react";
import { motion } from "framer-motion";

export default function ExpenseTopTabs() {
  const pathname = usePathname();

  const tabs = [
    { label: "Add", href: "/expenses", icon: Plus },
    { label: "History", href: "/expenses/history", icon: History },
    { label: "Recurring", href: "/expenses/recurring", icon: Repeat },
    { label: "Analysis", href: "/expenses/summary", icon: BarChart3 },
    { label: "Tax", href: "/expenses/tax", icon: Receipt },
    { label: "Settings", href: "/expenses/settings", icon: Settings2 },
  ];

  return (
    <div className="sticky top-0 z-50 w-full border-b border-border bg-background/85 backdrop-blur-md py-2 px-2 sm:px-4 flex justify-center overflow-x-auto no-scrollbar">
      <div className="flex w-full max-w-xl bg-muted/60 dark:bg-slate-900/60 p-1 rounded-2xl border border-border/50 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)] overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-1 flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 py-1.5 sm:py-2 px-1 sm:px-3 rounded-xl text-[10px] sm:text-xs font-bold transition-all relative font-sans whitespace-nowrap select-none",
                isActive
                  ? "text-primary dark:text-blue-400"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {/* Active Background Slide */}
              {isActive && (
                <motion.div
                  layoutId="active-top-tab"
                  className="absolute inset-0 bg-white dark:bg-slate-800 rounded-xl shadow-sm z-0"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}

              <Icon
                className={cn(
                  "w-3.5 h-3.5 sm:w-4 sm:h-4 z-10 transition-transform duration-200",
                  isActive ? "scale-105" : "scale-100",
                )}
              />
              <span className="z-10">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
