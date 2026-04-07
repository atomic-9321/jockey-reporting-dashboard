"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Image,
  GitBranch,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MOBILE_NAV_ITEMS = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/reports/weekly", label: "Weekly", icon: CalendarDays },
  { href: "/ads", label: "Ads", icon: Image },
  { href: "/funnel", label: "Funnel", icon: GitBranch },
  { href: "/insights", label: "Insights", icon: Sparkles },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden items-center justify-around h-16 bg-sidebar/90 backdrop-blur-2xl border-t border-border/30">
      {/* Top neon accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent" />
      {MOBILE_NAV_ITEMS.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-1.5 text-[10px] font-medium transition-all duration-300 relative",
              isActive
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            {/* Active glow dot */}
            {isActive && (
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-primary shadow-[0_0_8px_oklch(0.78_0.17_195_/_50%)]" />
            )}
            <item.icon
              size={20}
              className={cn(
                "transition-all duration-300",
                isActive && "drop-shadow-[0_0_6px_oklch(0.78_0.17_195_/_40%)]"
              )}
            />
            <span className={cn(isActive && "neon-text")}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
