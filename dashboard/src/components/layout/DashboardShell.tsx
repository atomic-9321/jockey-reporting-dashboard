"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileNav } from "./MobileNav";
import { RegionContext, useRegionState } from "@/hooks/useRegion";

export function DashboardShell({ children }: { children: ReactNode }) {
  const regionState = useRegionState("EU");
  const pathname = usePathname();

  // Render login page without dashboard chrome
  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <RegionContext.Provider value={regionState}>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto pb-16 md:pb-0 bg-grid relative">
            <div className="relative z-10 p-4 md:p-8 max-w-[1400px] mx-auto">
              {children}
            </div>
          </main>
        </div>
        <MobileNav />
      </div>
    </RegionContext.Provider>
  );
}
