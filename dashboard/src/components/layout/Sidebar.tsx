"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  CalendarRange,
  Image,
  GitBranch,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/reports/weekly", label: "Weekly", icon: CalendarDays },
  { href: "/reports/monthly", label: "Monthly", icon: CalendarRange },
  { href: "/ads", label: "Ads Library", icon: Image },
  { href: "/funnel", label: "Funnel", icon: GitBranch },
  { href: "/insights", label: "AI Insights", icon: Sparkles },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-screen sticky top-0 border-r border-sidebar-border/60 bg-sidebar/90 backdrop-blur-xl transition-all duration-300 ease-in-out relative",
        collapsed ? "w-[60px]" : "w-[220px]"
      )}
    >
      {/* Neon accent line on right edge */}
      <div className="absolute right-0 top-0 bottom-0 w-px sidebar-glow-line" />

      {/* Brand */}
      <div className="flex items-center h-14 px-4 border-b border-sidebar-border/40">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary via-accent to-primary flex items-center justify-center shrink-0 shadow-[0_0_16px_oklch(0.78_0.17_195_/_25%)] holo-border">
            <span className="text-[12px] font-black text-white tracking-tighter">
              J
            </span>
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <span className="text-sm font-bold tracking-[0.25em] text-foreground neon-text">
                JOCKEY
              </span>
              <p className="text-[9px] text-muted-foreground leading-none -mt-0.5 tracking-widest uppercase">
                Reporting
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-300 relative overflow-hidden",
                isActive
                  ? "text-primary bg-primary/8"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              {/* Active indicator — neon bar */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 rounded-r-full bg-primary shadow-[0_0_8px_oklch(0.78_0.17_195_/_50%)]" />
              )}
              {/* Active glow backdrop */}
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-primary/6 to-transparent pointer-events-none" />
              )}
              <item.icon
                className={cn(
                  "shrink-0 transition-all duration-300",
                  collapsed ? "mx-auto" : "",
                  isActive
                    ? "text-primary drop-shadow-[0_0_6px_oklch(0.78_0.17_195_/_40%)]"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
                size={18}
              />
              {!collapsed && (
                <span className="relative z-10">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-10 border-t border-sidebar-border/40 text-muted-foreground hover:text-primary transition-all duration-300 hover:bg-primary/5"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  );
}
