"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TagBadge } from "./tag-badge";
import { Tags, Check } from "lucide-react";
import type { Tag } from "@/types/database";

interface TagPickerProps {
  noteId: string;
  selectedTagIds: string[];
  onTagsChange: (tagIds: string[]) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TagPicker({
  selectedTagIds,
  onTagsChange,
  open,
  onOpenChange,
}: TagPickerProps) {
  const { user } = useUser();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (user && open) fetchTags();
  }, [user, open]);

  async function fetchTags() {
    const { data } = await supabase
      .from("tags")
      .select("*")
      .eq("user_id", user!.id)
      .order("name", { ascending: true });

    setTags(data || []);
    setLoading(false);
  }

  function toggleTag(tagId: string) {
    const newIds = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter((id) => id !== tagId)
      : [...selectedTagIds, tagId];
    onTagsChange(newIds);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tags className="w-5 h-5 text-primary" />
            Assign Tags
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-1 max-h-64 overflow-y-auto">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Loading tags...
            </p>
          ) : tags.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No tags created yet. Use &quot;Manage Tags&quot; to create some!
            </p>
          ) : (
            tags.map((tag) => {
              const isSelected = selectedTagIds.includes(tag.id);
              return (
                <Button
                  key={tag.id}
                  variant="ghost"
                  className="w-full justify-start gap-2 cursor-pointer"
                  onClick={() => toggleTag(tag.id)}
                >
                  <div
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                      isSelected
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/30"
                    }`}
                  >
                    {isSelected && (
                      <Check className="w-2.5 h-2.5 text-primary-foreground" />
                    )}
                  </div>
                  <TagBadge tag={tag} size="md" />
                </Button>
              );
            })
          )}
        </div>

        {/* Selected count */}
        {selectedTagIds.length > 0 && (
          <p className="text-xs text-muted-foreground text-center pt-2 border-t border-border/50">
            {selectedTagIds.length} tag{selectedTagIds.length !== 1 ? "s" : ""}{" "}
            selected
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
