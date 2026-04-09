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

  // Handle URL syncing (optional, keeps OS feel pure by preventing default Next.js navigation wiping state, our OS naturally handles state)
  // Instead of full routing, apps inside windows function natively.
  
  return (
    <div className="fixed inset-0 overflow-hidden bg-black text-foreground font-sans flex flex-col os-desktop-bg">
      {/* Background Image / Wallpaper */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0" 
        style={{ 
          backgroundImage: "url('https://images.unsplash.com/photo-1542401886-65d6c61db217?q=80&w=3840&auto=format&fit=crop')", // Example macOS-like abstract wallpaper
          filter: "brightness(0.8) contrast(1.1)"
        }} 
      />
      
      {/* Menu Bar */}
      <MenuBar />
      
      {/* OS Desktop Area */}
      <div className="flex-1 relative z-10">
        {windows.map((win) => (
          <Window 
            key={win.id} 
            {...win}
          >
            {/* If there's a dynamic route id matching the window, we COULD render `children`, but for pure OS isolation: */}
            <div className="h-full overflow-y-auto custom-scrollbar p-0 m-0">
               {/* 
                 Trick: If the current pathname matches this app's route AND there's nested children 
                 (e.g., viewing a specific note), we render `children`. 
                 Otherwise we render the root component. 
                */}
               { (pathname.includes(`/dashboard/${win.appId === 'dashboard' ? '' : win.appId}`) && pathname !== `/dashboard/${win.appId === 'dashboard' ? '' : win.appId}`) 
                  ? children 
                  : APP_COMPONENTS[win.appId] || <div className="p-8">App not found</div>
               }
            </div>
          </Window>
        ))}
      </div>

      {/* Dock */}
      <Dock />
    </div>
  );
}
