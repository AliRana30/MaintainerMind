"use client";

import React, { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/layout/Sidebar";
import DashboardHeader from "@/components/layout/DashboardHeader";
import AmbientBackground from "@/components/layout/AmbientBackground";
import { SmoothCursor } from "@/components/ui/smooth-cursor";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Lenis from "lenis";

import { ScrollContext } from "@/components/layout/ScrollContext";
import { signOut } from "next-auth/react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 5000,
          },
        },
      })
  );

  // 30-minute auto-logout
  useEffect(() => {
    const logoutTimer = setTimeout(() => {
      signOut({ callbackUrl: "/login" });
    }, 30 * 60 * 1000);

    return () => clearTimeout(logoutTimer);
  }, []);

  const mainScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Lenis custom scrolling removed to restore native fast scrolling
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ScrollContext.Provider value={mainScrollRef}>
        {/* SmoothCursor mounted ONCE here — scoped to authenticated shell only */}
        {/* Renders above all z-layers (z-999999 internally), touch-guarded internally */}
        <SmoothCursor />
        <div className="h-screen w-screen bg-[#FBFAFE] text-[#1C1B1F] flex overflow-hidden font-sans relative cursor-none">
          <AmbientBackground />

          <div 
            className="absolute inset-0 pointer-events-none opacity-40 z-0" 
            style={{
              backgroundImage: "radial-gradient(#E4E1EC 1.5px, transparent 1.5px)",
              backgroundSize: "24px 24px",
              maskImage: "radial-gradient(ellipse 60% 60% at 50% 50%, #000 70%, transparent 100%)",
              WebkitMaskImage: "radial-gradient(ellipse 60% 60% at 50% 50%, #000 70%, transparent 100%)"
            }}
          />

          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#6E56F2] opacity-[0.04] blur-[120px] pointer-events-none z-0" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#6E56F2] opacity-[0.04] blur-[120px] pointer-events-none z-0" />

          <Sidebar />

          <div className="flex-1 flex flex-col overflow-hidden relative z-10 h-full">
            <DashboardHeader />

            <main 
              ref={mainScrollRef}
              id="main-scroll-container"
              className="flex-1 overflow-y-auto h-full relative z-0"
            >
              <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8 min-h-full">
                {children}
              </div>
            </main>
          </div>
        </div>
      </ScrollContext.Provider>
    </QueryClientProvider>
  );
}
