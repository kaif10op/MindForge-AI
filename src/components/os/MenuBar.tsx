"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { useUser } from "@/hooks/use-user";
import { Search, Wifi, Battery, ChevronRight, LogOut, Settings } from "lucide-react";
import { useOSStore } from "@/store/os-store";

export function MenuBar() {
  const [time, setTime] = useState(new Date());
  const { user, signOut } = useUser();
  const { activeWindowId, windows, closeAllWindows } = useOSStore();
  const [appleMenuOpen, setAppleMenuOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeWindow = windows.find(w => w.id === activeWindowId);
  const activeAppName = activeWindow?.title || "Finder";

  const handleSignOut = () => {
    closeAllWindows();
    signOut();
  };

  return (
    <div className="h-8 w-full bg-black/40 backdrop-blur-md border-b border-white/10 text-white flex items-center px-4 justify-between select-none z-[100] relative">
      {/* Left side */}
      <div className="flex items-center space-x-4 text-sm font-medium">
        <div className="relative">
          <button 
            className="flex items-center hover:bg-white/10 px-2 py-0.5 rounded cursor-pointer"
            onClick={() => setAppleMenuOpen(!appleMenuOpen)}
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z" opacity="0.3"/>
              <path d="M12 6a6 6 0 100 12 6 6 0 000-12zm0 10a4 4 0 110-8 4 4 0 010 8z" />
            </svg>
          </button>

          {/* Apple Menu Dropdown */}
          {appleMenuOpen && (
            <>
              <div className="fixed inset-0 z-[90]" onClick={() => setAppleMenuOpen(false)} />
              <div className="absolute top-full left-0 mt-1 w-56 bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl py-1 z-[100]">
                <div className="px-3 py-1.5 text-xs text-white/50 border-b border-white/10 mb-1">
                  MindForge OS Workspace
                </div>
                <button className="w-full text-left px-3 py-1 text-sm hover:bg-blue-500 hover:text-white transition-colors">
                  About MindForge OS
                </button>
                <div className="h-px bg-white/10 my-1" />
                <button className="w-full text-left px-3 py-1 text-sm hover:bg-blue-500 hover:text-white transition-colors flex items-center justify-between">
                  System Settings...
                  <Settings className="w-3 h-3 opacity-50" />
                </button>
                <div className="h-px bg-white/10 my-1" />
                {activeAppName !== "Finder" && (
                  <button 
                    className="w-full text-left px-3 py-1 text-sm hover:bg-blue-500 hover:text-white transition-colors"
                  >
                    Quit {activeAppName}
                  </button>
                )}
                <div className="h-px bg-white/10 my-1" />
                <button 
                  onClick={handleSignOut}
                  className="w-full text-left px-3 py-1 text-sm hover:bg-blue-500 hover:text-white transition-colors flex items-center justify-between"
                >
                  Log Out {user?.name?.split(' ')[0]}...
                  <LogOut className="w-3 h-3 opacity-50" />
                </button>
              </div>
            </>
          )}
        </div>
        
        <span className="font-bold cursor-default">{activeAppName}</span>
        
        <div className="hidden sm:flex space-x-4">
          <span className="cursor-default hover:text-white/80 transition-colors">File</span>
          <span className="cursor-default hover:text-white/80 transition-colors">Edit</span>
          <span className="cursor-default hover:text-white/80 transition-colors">View</span>
          <span className="cursor-default hover:text-white/80 transition-colors">Window</span>
          <span className="cursor-default hover:text-white/80 transition-colors">Help</span>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-4 text-sm">
        <Wifi className="w-4 h-4 text-white/80" />
        <Battery className="w-4 h-4 text-white/80" />
        <Search className="w-4 h-4 text-white/80" />
        <span className="cursor-default">{format(time, "EEE MMM d   h:mm a")}</span>
      </div>
    </div>
  );
}
