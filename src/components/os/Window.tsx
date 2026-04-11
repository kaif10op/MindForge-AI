"use client";

import React, { useState } from "react";
import { Rnd } from "react-rnd";
import { motion, AnimatePresence } from "framer-motion";
import { useOSStore } from "@/store/os-store";
import { X, Minus, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";

interface WindowProps {
  id: string;
  appId: string;
  title: string;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  children: React.ReactNode;
}

export function Window({ id, appId, title, isMinimized, isMaximized, zIndex, children }: WindowProps) {
  const { closeWindow, minimizeWindow, maximizeWindow, restoreWindow, focusWindow, activeWindowId } = useOSStore();
  const router = useRouter();
  const pathname = usePathname();
  
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [position, setPosition] = useState({ x: 100 + Math.random() * 50, y: 50 + Math.random() * 50 });

  const isActive = activeWindowId === id;

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    closeWindow(id);
    // If the window we are closing is the one that's tied to our current URL route,
    // we should pop the route back to the base dashboard so that refreshing doesn't re-open it.
    if (pathname.includes(`/dashboard/${appId === 'dashboard' ? '' : appId}`)) {
      if (appId !== 'dashboard') {
        router.push('/dashboard');
      }
    }
  };

  if (isMinimized) return null;

  const content = (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn(
        "flex flex-col w-full h-full rounded-[14px] overflow-hidden bg-black/40 backdrop-blur-3xl border shadow-2xl transition-all duration-300 relative before:pointer-events-none before:absolute before:inset-0 before:rounded-[14px] before:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]",
        isActive ? "border-white/20 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]" : "border-white/10 shadow-[0_15px_30px_-15px_rgba(0,0,0,0.3)] opacity-95"
      )}
      onClick={() => focusWindow(id)}
    >
      {/* Title Bar */}
      <div 
        className={cn(
          "h-12 flex items-center justify-between px-4 window-drag-handle cursor-grab active:cursor-grabbing border-b transition-colors group/titlebar",
          isActive ? "bg-white/5 border-white/10" : "bg-transparent border-white/5"
        )}
        onDoubleClick={() => isMaximized ? restoreWindow(id) : maximizeWindow(id)}
      >
        <div className="flex items-center gap-2 group/lights">
          {/* Traffic Lights */}
          <button 
            onClick={handleClose}
            className="w-3.5 h-3.5 rounded-full bg-[#ff5f56] hover:bg-[#ff5f56] flex items-center justify-center border border-black/10 shadow-sm"
          >
            <X className="w-2.5 h-2.5 text-black/60 opacity-0 group-hover/lights:opacity-100 transition-opacity" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); minimizeWindow(id); }}
            className="w-3.5 h-3.5 rounded-full bg-[#ffbd2e] hover:bg-[#ffbd2e] flex items-center justify-center border border-black/10 shadow-sm"
          >
            <Minus className="w-2.5 h-2.5 text-black/60 opacity-0 group-hover/lights:opacity-100 transition-opacity" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); isMaximized ? restoreWindow(id) : maximizeWindow(id); }}
            className="w-3.5 h-3.5 rounded-full bg-[#27c93f] hover:bg-[#27c93f] flex items-center justify-center border border-black/10 shadow-sm"
          >
            <Maximize2 className="w-2.5 h-2.5 text-black/60 opacity-0 group-hover/lights:opacity-100 transition-opacity" />
          </button>
        </div>
        <div className="font-medium text-[13px] text-foreground/80 flex-1 text-center pointer-events-none tracking-wide text-shadow-sm transition-opacity">
          {title}
        </div>
        <div className="w-12" /> {/* Spacer for centering */}
      </div>

      {/* Window Body */}
      <div className="flex-1 overflow-auto bg-background/80 backdrop-blur-md">
        {children}
      </div>
    </motion.div>
  );

  if (isMaximized) {
    return (
      <div 
        className="absolute inset-0 z-50 pt-8 pb-16 px-0" 
        style={{ zIndex }}
        onClick={() => focusWindow(id)}
      >
        {content}
      </div>
    );
  }

  return (
    <Rnd
      size={{ width: size.width, height: size.height }}
      position={{ x: position.x, y: position.y }}
      onDragStop={(e, d) => setPosition({ x: d.x, y: d.y })}
      onResizeStop={(e, direction, ref, delta, position) => {
        setSize({
          width: parseInt(ref.style.width, 10),
          height: parseInt(ref.style.height, 10),
        });
        setPosition(position);
      }}
      minWidth={400}
      minHeight={300}
      bounds="parent"
      dragHandleClassName="window-drag-handle"
      style={{ zIndex }}
      onClickCapture={() => focusWindow(id)}
    >
      {content}
    </Rnd>
  );
}
