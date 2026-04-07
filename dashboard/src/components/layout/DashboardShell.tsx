"use client";

import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileNav } from "./MobileNav";
import { RegionContext } from "@/hooks/useRegion";
import { useRegionState } from "@/hooks/useRegion";

export function DashboardShell({ children }: { children: ReactNode }) {
  const regionState = useRegionState("EU");

  return (
    <RegionContext.Provider value={regionState}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
            <div className="p-4 md:p-6 max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
        <MobileNav />
      </div>
    </RegionContext.Provider>
  );
}
