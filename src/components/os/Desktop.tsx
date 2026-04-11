"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useOSStore } from "@/store/os-store";
import { Window } from "./Window";
import { MenuBar } from "./MenuBar";
import { Dock } from "./Dock";

import DashboardPage from "@/app/dashboard/page";
import NotesPage from "@/app/dashboard/notes/page";
import SummarizerPage from "@/app/dashboard/summarizer/page";
import ResearchPage from "@/app/dashboard/research/page";

const APP_COMPONENTS: Record<string, React.ReactNode> = {
  dashboard: <DashboardPage />,
  notes: <NotesPage />,
  summarizer: <SummarizerPage />,
  research: <ResearchPage />
};

export function Desktop({ children }: { children: React.ReactNode }) {
  const { windows, openWindow } = useOSStore();
  const pathname = usePathname();
  const router = useRouter();

  // Map URL paths to our OS apps
  useEffect(() => {
    if (pathname === "/dashboard") {
      openWindow("dashboard", "Dashboard");
    } else if (pathname.includes("/dashboard/notes")) {
      openWindow("notes", "Notes App");
    } else if (pathname.includes("/dashboard/summarizer")) {
      openWindow("summarizer", "YouTube Summarizer");
    } else if (pathname.includes("/dashboard/research")) {
      openWindow("research", "AI Research");
    }
  }, [pathname, openWindow]);

  return (
    <div className="fixed inset-0 overflow-hidden bg-zinc-950 text-foreground font-sans flex flex-col os-desktop-bg select-none">
      
      {/* Dynamic Animated Wallpaper Background */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-black">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/30 blur-[120px] mix-blend-screen animate-pulse duration-[8000ms]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-700/20 blur-[130px] mix-blend-screen animate-pulse duration-[10000ms]" />
        <div className="absolute top-[20%] right-[10%] w-[35%] h-[35%] rounded-full bg-blue-500/20 blur-[100px] mix-blend-screen animate-pulse duration-[12000ms]" />
        <div className="absolute bottom-[10%] left-[20%] w-[45%] h-[45%] rounded-full bg-teal-800/20 blur-[140px] mix-blend-screen animate-pulse duration-[9000ms]" />
        {/* Grain overlay for premium texture */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')" }}/>
      </div>
      
      {/* Menu Bar */}
      <MenuBar />
      
      {/* OS Desktop Area */}
      <div className="flex-1 relative z-10 w-full h-full">
        {windows.map((win) => (
          <Window 
            key={win.id} 
            {...win}
          >
            <div className="h-full w-full overflow-y-auto custom-scrollbar p-0 m-0">
               { (() => {
                  const isDashboardWindow = win.appId === 'dashboard';
                  const isSubRouteOfThisApp = !isDashboardWindow 
                    ? pathname.startsWith(`/dashboard/${win.appId}/`) 
                    : false; // Dashboard has no sub-routes inside its window

                  return isSubRouteOfThisApp 
                    ? children 
                    : APP_COMPONENTS[win.appId] || <div className="p-8 flex h-full items-center justify-center text-muted-foreground font-light">App launching...</div>;
               })()}
            </div>
          </Window>
        ))}
      </div>

      {/* Dock */}
      <Dock />
    </div>
  );
}
