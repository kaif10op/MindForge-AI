"use client";

import React, { useState } from "react";
import { Rnd } from "react-rnd";
import { motion, AnimatePresence } from "framer-motion";
import { useOSStore } from "@/store/os-store";
import { X, Minus, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface WindowProps {
  id: string;
  title: string;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  children: React.ReactNode;
}

export function Window({ id, title, isMinimized, isMaximized, zIndex, children }: WindowProps) {
  const { closeWindow, minimizeWindow, maximizeWindow, restoreWindow, focusWindow, activeWindowId } = useOSStore();
  
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [position, setPosition] = useState({ x: 100 + Math.random() * 50, y: 50 + Math.random() * 50 });

  const isActive = activeWindowId === id;

  if (isMinimized) return null;

  const content = (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex flex-col w-full h-full rounded-xl overflow-hidden glass border shadow-2xl transition-shadow",
        isActive ? "border-primary/30 shadow-primary/10" : "border-white/10 shadow-black/20"
      )}
      onClick={() => focusWindow(id)}
    >
      {/* Title Bar */}
      <div 
        className={cn(
          "h-10 flex items-center justify-between px-4 window-drag-handle cursor-grab active:cursor-grabbing border-b",
          isActive ? "bg-white/10 border-white/10" : "bg-black/20 border-white/5"
        )}
        onDoubleClick={() => isMaximized ? restoreWindow(id) : maximizeWindow(id)}
      >
        <div className="flex items-center gap-2">
          {/* Traffic Lights */}
          <button 
            onClick={(e) => { e.stopPropagation(); closeWindow(id); }}
            className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center group"
          >
            <X className="w-2 h-2 text-black/50 opacity-0 group-hover:opacity-100" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); minimizeWindow(id); }}
            className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600 flex items-center justify-center group"
          >
            <Minus className="w-2 h-2 text-black/50 opacity-0 group-hover:opacity-100" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); isMaximized ? restoreWindow(id) : maximizeWindow(id); }}
            className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center group"
          >
            <Maximize2 className="w-2 h-2 text-black/50 opacity-0 group-hover:opacity-100" />
          </button>
        </div>
        <div className="font-medium text-sm text-foreground/80 flex-1 text-center pointer-events-none">
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
