"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TagBadge } from "./tag-badge";
import { Plus, Tags, Trash2, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import type { Tag } from "@/types/database";

const TAG_COLORS = [
  // Primary / Vibrant Palette
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#d946ef", // Fuchsia
  "#ec4899", // Pink
  "#f43f5e", // Rose
  "#ef4444", // Red
  "#f97316", // Orange
  "#f59e0b", // Amber
  "#eab308", // Yellow
  "#84cc16", // Lime
  "#22c55e", // Green
  "#10b981", // Emerald
  "#14b8a6", // Teal
  "#06b6d4", // Cyan
  "#0ea5e9", // Light Blue
  "#3b82f6", // Blue
  // Deep / Muted Options
  "#475569", // Slate
  "#52525b", // Zinc
  "#78716c", // Stone
  "#a855f7", // Purple
];

interface TagManagerProps {
  onTagsChange?: () => void;
}

export function TagManager({ onTagsChange }: TagManagerProps) {
  const { user } = useUser();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

  const supabase = createClient();

  useEffect(() => {
    if (user && open) fetchTags();
  }, [user, open]);

  async function fetchTags() {
    const { data, error } = await supabase
      .from("tags")
      .select("*")
      .eq("user_id", user!.id)
      .order("name", { ascending: true });

    if (!error) setTags(data || []);
    setLoading(false);
  }

  async function createTag() {
    if (!newTagName.trim()) return;
    setCreating(true);

    const { data, error } = await supabase
      .from("tags")
      .insert({
        user_id: user!.id,
        name: newTagName.trim(),
        color: newTagColor,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        toast.error("Tag already exists");
      } else {
        toast.error("Failed to create tag");
      }
    } else {
      setTags([...tags, data]);
      setNewTagName("");
      setNewTagColor(TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)]);
      toast.success("Tag created");
      onTagsChange?.();
    }
    setCreating(false);
  }

  async function deleteTag(tagId: string) {
    const { error } = await supabase.from("tags").delete().eq("id", tagId);
    if (error) {
      toast.error("Failed to delete tag");
    } else {
      setTags(tags.filter((t) => t.id !== tagId));
      toast.success("Tag deleted");
      onTagsChange?.();
    }
  }

  async function updateTag(tagId: string) {
    if (!editName.trim()) return;

    const { data, error } = await supabase
      .from("tags")
      .update({ name: editName.trim(), color: editColor })
      .eq("id", tagId)
      .select()
      .single();

    if (error) {
      toast.error("Failed to update tag");
    } else {
      setTags(tags.map((t) => (t.id === tagId ? data : t)));
      setEditingId(null);
      toast.success("Tag updated");
      onTagsChange?.();
    }
  }

  function startEdit(tag: Tag) {
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 cursor-pointer"
              id="manage-tags-btn"
            />
          }
        >
          <Tags className="w-3.5 h-3.5" />
          Manage Tags
        </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tags className="w-5 h-5 text-primary" />
            Manage Tags
          </DialogTitle>
        </DialogHeader>

        {/* Create New Tag */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="New tag name..."
              className="flex-1"
              maxLength={30}
              onKeyDown={(e) => e.key === "Enter" && createTag()}
              id="new-tag-input"
            />
            <Button
              onClick={createTag}
              disabled={creating || !newTagName.trim()}
              size="sm"
              className="cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Color Palette */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-muted-foreground mr-1">Color:</span>
            {TAG_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setNewTagColor(color)}
                className={`w-5 h-5 rounded-full transition-all duration-200 cursor-pointer ${
                  newTagColor === color
                    ? "ring-2 ring-offset-2 ring-offset-background scale-110"
                    : "hover:scale-110"
                }`}
                style={{
                  backgroundColor: color,
                  ...(newTagColor === color ? { ringColor: color } : {}),
                }}
                aria-label={`Select color ${color}`}
              />
            ))}
          </div>

          {/* Preview */}
          {newTagName.trim() && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Preview:</span>
              <TagBadge
                tag={{
                  id: "preview",
                  user_id: "",
                  name: newTagName.trim(),
                  color: newTagColor,
                  created_at: "",
                }}
                size="md"
              />
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-border/50 my-1" />

        {/* Existing Tags */}
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Loading tags...
            </p>
          ) : tags.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No tags yet. Create one above!
            </p>
          ) : (
            <AnimatePresence>
              {tags.map((tag) => (
                <motion.div
                  key={tag.id}
                  layout
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 group"
                >
                  {editingId === tag.id ? (
                    <>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 h-7 text-sm"
                        maxLength={30}
                        onKeyDown={(e) =>
                          e.key === "Enter" && updateTag(tag.id)
                        }
                      />
                      <div className="flex items-center gap-0.5">
                        {TAG_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setEditColor(color)}
                            className={`w-3.5 h-3.5 rounded-full cursor-pointer ${
                              editColor === color
                                ? "ring-1 ring-offset-1 ring-offset-background"
                                : ""
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 cursor-pointer"
                        onClick={() => updateTag(tag.id)}
                      >
                        <Check className="w-3 h-3 text-emerald-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 cursor-pointer"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <TagBadge tag={tag} size="md" />
                      <span className="flex-1" />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        onClick={() => startEdit(tag)}
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive cursor-pointer"
                        onClick={() => deleteTag(tag.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
