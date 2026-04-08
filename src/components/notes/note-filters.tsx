"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TagBadge } from "./tag-badge";
import {
  Search,
  Filter,
  X,
  Pin,
  CalendarDays,
} from "lucide-react";
import type { Tag } from "@/types/database";

interface NoteFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedTagId: string | null;
  onTagFilter: (tagId: string | null) => void;
  dateFrom: string;
  onDateFromChange: (date: string) => void;
  dateTo: string;
  onDateToChange: (date: string) => void;
  pinnedOnly: boolean;
  onPinnedToggle: (pinned: boolean) => void;
  onClearFilters: () => void;
  tagsRefreshKey?: number;
}

export function NoteFilters({
  searchQuery,
  onSearchChange,
  selectedTagId,
  onTagFilter,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  pinnedOnly,
  onPinnedToggle,
  onClearFilters,
  tagsRefreshKey,
}: NoteFiltersProps) {
  const { user } = useUser();
  const [tags, setTags] = useState<Tag[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const supabase = createClient();

  const hasActiveFilters =
    searchQuery || selectedTagId || dateFrom || dateTo || pinnedOnly;

  useEffect(() => {
    if (user) fetchTags();
  }, [user, tagsRefreshKey]);

  async function fetchTags() {
    const { data } = await supabase
      .from("tags")
      .select("*")
      .eq("user_id", user!.id)
      .order("name", { ascending: true });

    setTags(data || []);
  }

  return (
    <div className="space-y-3">
      {/* Main search row */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-9"
            id="search-notes"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={pinnedOnly ? "default" : "outline"}
            size="sm"
            onClick={() => onPinnedToggle(!pinnedOnly)}
            className={`gap-1.5 cursor-pointer transition-all duration-200 ${
              pinnedOnly ? "shadow-md" : ""
            }`}
            id="pinned-filter-btn"
          >
            <Pin className={`w-3.5 h-3.5 ${pinnedOnly ? "fill-current" : ""}`} />
            Pinned
          </Button>

          <Button
            variant={showAdvanced ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="gap-1.5 cursor-pointer"
            id="advanced-filters-btn"
          >
            <Filter className="w-3.5 h-3.5" />
            Filters
          </Button>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
              id="clear-filters-btn"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Tag chips row */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <TagBadge
              key={tag.id}
              tag={tag}
              size="sm"
              onClick={() =>
                onTagFilter(selectedTagId === tag.id ? null : tag.id)
              }
            />
          ))}
          {selectedTagId && (
            <button
              type="button"
              onClick={() => onTagFilter(null)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              ✕ Clear tag
            </button>
          )}
        </div>
      )}

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="flex flex-wrap gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">From:</span>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
              className="h-8 w-auto text-xs"
              id="date-from-filter"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">To:</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
              className="h-8 w-auto text-xs"
              id="date-to-filter"
            />
          </div>
        </div>
      )}
    </div>
  );
}
