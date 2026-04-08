"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Brain, FileText, PlaySquare, Search, Shield, LayoutDashboard } from "lucide-react";
import type { User } from "@/types/database";
import { motion } from "framer-motion";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Notes",
    href: "/dashboard/notes",
    icon: FileText,
  },
  {
    label: "Summarizer",
    href: "/dashboard/summarizer",
    icon: PlaySquare,
  },
  {
    label: "Research",
    href: "/dashboard/research",
    icon: Search,
  },
];

interface SidebarProps {
  user: User;
  className?: string;
}

export function Sidebar({ user, className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen w-64 flex-col border-r border-border bg-sidebar",
        className
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10">
          <Brain className="w-5 h-5 text-primary" />
        </div>
        <span className="text-lg font-bold tracking-tight gradient-text">
          MindForge AI
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="w-4.5 h-4.5" />
                {item.label}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-indicator"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                  />
                )}
              </motion.div>
            </Link>
          );
        })}

        {/* Admin link */}
        {user.is_admin && (
          <>
            <div className="my-4 border-t border-border" />
            <Link href="/dashboard/admin">
              <motion.div
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  pathname === "/dashboard/admin"
                    ? "bg-amber-500/10 text-amber-500"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Shield className="w-4.5 h-4.5" />
                Admin Panel
              </motion.div>
            </Link>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          MindForge AI v1.0
        </p>
      </div>
    </aside>
  );
}
