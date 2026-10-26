"use client";

import React, { Suspense } from "react";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { DashboardProvider } from "@/components/dashboard-provider.tsx";
import { PlanProvider } from "@/components/plan-provider.tsx";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <DashboardProvider>
          <PlanProvider>
            <div className="flex h-screen bg-bg text-ink transition-colors duration-200 overflow-hidden">
              <Sidebar />
              <div className="flex flex-col flex-1 h-full min-w-0">
                <div className="shrink-0 pt-[22px] px-[30px] pb-[18px] max-lg:px-[20px] max-md:px-4">
                  <Topbar />
                </div>
                <main className="flex-1 overflow-y-auto px-[30px] pb-[60px] max-lg:px-[20px] max-md:px-4 max-md:pb-12">
                  {children}
                </main>
              </div>
            </div>
          </PlanProvider>
      </DashboardProvider>
    </Suspense>
  );
}
