"use client";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";
import type { User } from "@/types/database";

interface MobileNavProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileNav({ user, open, onOpenChange }: MobileNavProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="p-0 w-64">
        <Sidebar user={user} className="flex relative w-full border-r-0" />
      </SheetContent>
    </Sheet>
  );
}
