"use client";

import React from "react";
import { motion } from "framer-motion";
import { useOSStore } from "@/store/os-store";
import { Layout, FileText, PlaySquare, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const DOCK_ITEMS = [
  { id: "dashboard", label: "Dashboard", title: "Dashboard", icon: Layout, color: "text-blue-400", bg: "bg-blue-500/20" },
  { id: "notes", label: "Notes", title: "Notes App", icon: FileText, color: "text-amber-400", bg: "bg-amber-500/20" },
  { id: "summarizer", label: "Summarizer", title: "YouTube Summarizer", icon: PlaySquare, color: "text-red-400", bg: "bg-red-500/20" },
  { id: "research", label: "Research", title: "AI Research", icon: Search, color: "text-emerald-400", bg: "bg-emerald-500/20" },
];

export function Dock() {
  const { windows, openWindow, minimizeWindow, restoreWindow, activeWindowId } = useOSStore();

  const handleIconClick = (appId: string, title: string) => {
    const existingWindow = windows.find((w) => w.appId === appId);
    if (existingWindow) {
      if (existingWindow.isMinimized) {
        restoreWindow(existingWindow.id);
      } else if (activeWindowId === existingWindow.id) {
        minimizeWindow(existingWindow.id);
      } else {
        restoreWindow(existingWindow.id); // Also focuses it
      }
    } else {
      openWindow(appId, title);
    }
  };

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[100] group/dock pb-4">
      <div className="bg-white/10 backdrop-blur-2xl px-4 py-3 rounded-3xl flex items-end gap-4 shadow-2xl border border-white/20 relative before:pointer-events-none before:absolute before:inset-0 before:rounded-3xl before:shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]">
        {DOCK_ITEMS.map((item) => {
          const isOpen = windows.some((w) => w.appId === item.id);
          const isActive = windows.find((w) => w.appId === item.id)?.id === activeWindowId;

          return (
            <div key={item.id} className="relative group flex flex-col items-center">
              {/* Tooltip */}
              <div className="absolute -top-14 opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-100 bg-black/80 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-lg shadow-xl pointers-events-none whitespace-nowrap border border-white/10 font-medium tracking-wide">
                {item.label}
              </div>

              {/* Icon */}
              <motion.button
                onClick={() => handleIconClick(item.id, item.title)}
                initial={{ y: 0 }}
                whileHover={{ 
                  y: -12, 
                  scale: 1.3,
                  transition: { type: "spring", stiffness: 400, damping: 10 }
                }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-xl border overflow-hidden relative",
                  item.bg,
                  isActive ? "border-white/40 ring-2 ring-white/20" : "border-white/10 hover:border-white/30"
                )}
              >
                {/* Shiny gloss overlay */}
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none rounded-t-2xl" />
                <item.icon className={cn("w-7 h-7 filter drop-shadow-md", item.color)} />
              </motion.button>

              {/* Open Indicator */}
              <div className={cn(
                "w-1.5 h-1.5 rounded-full mt-2 transition-all duration-300 absolute -bottom-1",
                isOpen ? "opacity-100 bg-white/70 shadow-[0_0_8px_rgba(255,255,255,0.8)]" : "opacity-0 bg-transparent translate-y-2"
              )} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
