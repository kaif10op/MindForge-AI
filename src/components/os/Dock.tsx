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
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[100]">
      <div className="glass px-3 py-2 rounded-2xl flex items-end gap-3 shadow-2xl border border-white/10 glow">
        {DOCK_ITEMS.map((item) => {
          const isOpen = windows.some((w) => w.appId === item.id);
          const isActive = windows.find((w) => w.appId === item.id)?.id === activeWindowId;

          return (
            <div key={item.id} className="relative group cursor-pointer flex flex-col items-center">
              {/* Tooltip */}
              <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 backdrop-blur text-white text-xs px-3 py-1 rounded shadow-xl pointers-events-none whitespace-nowrap border border-white/10">
                {item.label}
              </div>

              {/* Icon */}
              <motion.button
                onClick={() => handleIconClick(item.id, item.title)}
                whileHover={{ scale: 1.2, translateY: -10 }}
                whileTap={{ scale: 0.9 }}
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center transition-colors shadow-lg border border-white/5",
                  item.bg,
                  isActive && "ring-2 ring-white/50"
                )}
              >
                <item.icon className={cn("w-6 h-6", item.color)} />
              </motion.button>

              {/* Open Indicator */}
              <div className={cn(
                "w-1 h-1 rounded-full bg-white/80 transition-all mt-1",
                isOpen ? "opacity-100" : "opacity-0"
              )} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
