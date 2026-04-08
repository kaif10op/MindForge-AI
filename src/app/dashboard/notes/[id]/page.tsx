"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Trash2,
  Check,
  Loader2,
  Pin,
  Sparkles,
  Tags,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { NoteEditor } from "@/components/notes/note-editor";
import { TagBadge } from "@/components/notes/tag-badge";
import { TagPicker } from "@/components/notes/tag-picker";
import { NoteSummaryDialog } from "@/components/notes/note-summary-dialog";
import type { NoteWithTags, Tag } from "@/types/database";

export default function NoteDetailPage() {
  const { user } = useUser();
  const router = useRouter();
  const params = useParams();
  const noteId = params.id as string;

  const [note, setNote] = useState<NoteWithTags | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [noteTags, setNoteTags] = useState<Tag[]>([]);
  const [noteTagIds, setNoteTagIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(true);

  // Dialogs
  const [tagPickerOpen, setTagPickerOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const debouncedTitle = useDebounce(title, 2000);
  const debouncedContent = useDebounce(content, 2000);

  const supabase = createClient();

  // Fetch note
  useEffect(() => {
    async function fetchNote() {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("id", noteId)
        .single();

      if (error || !data) {
        toast.error("Note not found");
        router.push("/dashboard/notes");
        return;
      }

      // Fetch tags
      const { data: noteTagLinks } = await supabase
        .from("note_tags")
        .select("tag_id")
        .eq("note_id", noteId);

      const tagIds = (noteTagLinks || []).map((nt) => nt.tag_id);
      let tags: Tag[] = [];

      if (tagIds.length > 0) {
        const { data: tagData } = await supabase
          .from("tags")
          .select("*")
          .in("id", tagIds);
        tags = (tagData || []) as Tag[];
      }

      const noteWithTags: NoteWithTags = { ...data, tags };

      setNote(noteWithTags);
      setTitle(data.title);
      setContent(data.content || "");
      setIsPinned(data.is_pinned || false);
      setNoteTags(tags);
      setNoteTagIds(tagIds);
      setLoading(false);
    }

    if (user) fetchNote();
  }, [user, noteId]);

  // Autosave
  const saveNote = useCallback(
    async (newTitle: string, newContent: string) => {
      if (!note) return;

      setSaving(true);
      setSaved(false);

      const { error } = await supabase
        .from("notes")
        .update({ title: newTitle, content: newContent })
        .eq("id", note.id);

      if (error) {
        toast.error("Failed to save");
      } else {
        setSaved(true);
      }
      setSaving(false);
    },
    [note, supabase]
  );

  useEffect(() => {
    if (
      !loading &&
      note &&
      (debouncedTitle !== note.title || debouncedContent !== note.content)
    ) {
      saveNote(debouncedTitle, debouncedContent);
    }
  }, [debouncedTitle, debouncedContent]);

  async function deleteNote() {
    if (!note) return;
    const { error } = await supabase.from("notes").delete().eq("id", note.id);
    if (error) {
      toast.error("Failed to delete");
    } else {
      toast.success("Note deleted");
      router.push("/dashboard/notes");
    }
  }

  async function togglePin() {
    if (!note) return;
    const newPinned = !isPinned;

    const { error } = await supabase
      .from("notes")
      .update({ is_pinned: newPinned })
      .eq("id", note.id);

    if (error) {
      toast.error("Failed to update pin status");
    } else {
      setIsPinned(newPinned);
      toast.success(newPinned ? "Note pinned" : "Note unpinned");
    }
  }

  async function handleTagsChange(tagIds: string[]) {
    if (!note) return;
    setNoteTagIds(tagIds);

    // Remove all existing tag links
    await supabase.from("note_tags").delete().eq("note_id", note.id);

    // Insert new tag links
    if (tagIds.length > 0) {
      const tagInserts = tagIds.map((tag_id) => ({
        note_id: note.id,
        tag_id,
      }));
      await supabase.from("note_tags").insert(tagInserts);
    }

    // Fetch updated tags for display
    if (tagIds.length > 0) {
      const { data: tagData } = await supabase
        .from("tags")
        .select("*")
        .in("id", tagIds);
      setNoteTags((tagData || []) as Tag[]);
    } else {
      setNoteTags([]);
    }
  }

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setTitle(e.target.value);
    setSaved(false);
  }

  function handleContentChange(newContent: string) {
    setContent(newContent);
    setSaved(false);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-full max-w-lg" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard/notes">
          <Button variant="ghost" size="sm" className="cursor-pointer">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          {/* AI Summarize */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSummaryOpen(true)}
            className="gap-1.5 cursor-pointer bg-gradient-to-r from-violet-500/5 to-indigo-500/5 border-violet-500/20 hover:border-violet-500/40 hover:from-violet-500/10 hover:to-indigo-500/10 transition-all duration-300"
            id="ai-summarize-btn"
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-500" />
            <span className="hidden sm:inline">Summarize</span>
          </Button>

          {/* Tags button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTagPickerOpen(true)}
            className="gap-1.5 cursor-pointer"
            id="assign-tags-btn"
          >
            <Tags className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tags</span>
            {noteTagIds.length > 0 && (
              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0 rounded-full">
                {noteTagIds.length}
              </span>
            )}
          </Button>

          {/* Pin toggle */}
          <Button
            variant={isPinned ? "default" : "outline"}
            size="icon"
            onClick={togglePin}
            className={`h-8 w-8 cursor-pointer transition-all duration-200 ${
              isPinned ? "shadow-md" : ""
            }`}
            title={isPinned ? "Unpin note" : "Pin note"}
            id="pin-toggle-btn"
          >
            <Pin
              className={`w-3.5 h-3.5 ${isPinned ? "fill-current" : ""}`}
            />
          </Button>

          {/* Save status */}
          <Badge variant="secondary" className="text-xs gap-1">
            {saving ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Saving...
              </>
            ) : saved ? (
              <>
                <Check className="w-3 h-3 text-emerald-500" />
                Saved
              </>
            ) : (
              "Unsaved"
            )}
          </Badge>

          <Button
            variant="ghost"
            size="icon"
            onClick={deleteNote}
            className="text-muted-foreground hover:text-destructive cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Tags display */}
      {noteTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {noteTags.map((tag) => (
            <TagBadge
              key={tag.id}
              tag={tag}
              size="md"
              removable
              onRemove={() =>
                handleTagsChange(noteTagIds.filter((id) => id !== tag.id))
              }
            />
          ))}
        </div>
      )}

      {/* Title */}
      <Input
        value={title}
        onChange={handleTitleChange}
        className="text-2xl font-bold border-none shadow-none px-0 h-auto text-foreground focus-visible:ring-0 placeholder:text-muted-foreground/50"
        placeholder="Note title..."
        id="note-title"
      />

      {/* Editor */}
      <div className="border border-border/50 rounded-xl overflow-hidden bg-card">
        <NoteEditor content={content} onChange={handleContentChange} />
      </div>

      {/* Dialogs */}
      <TagPicker
        noteId={noteId}
        selectedTagIds={noteTagIds}
        onTagsChange={handleTagsChange}
        open={tagPickerOpen}
        onOpenChange={setTagPickerOpen}
      />
      <NoteSummaryDialog
        noteId={noteId}
        open={summaryOpen}
        onOpenChange={setSummaryOpen}
      />
    </div>
  );
}
