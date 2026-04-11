"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  Plus,
  Trash2,
  Clock,
  Pin,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { formatRelativeTime, truncateText, stripHtml } from "@/lib/utils";
import { toast } from "sonner";
import { NoteFilters } from "@/components/notes/note-filters";
import { TagManager } from "@/components/notes/tag-manager";
import { TagBadge } from "@/components/notes/tag-badge";
import type { NoteWithTags } from "@/types/database";

export default function NotesPage() {
  const { user } = useUser();
  const router = useRouter();
  const [notes, setNotes] = useState<NoteWithTags[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [tagsRefreshKey, setTagsRefreshKey] = useState(0);

  const supabase = createClient();

  const fetchNotes = useCallback(async () => {
    if (!user) return;

    let query = supabase
      .from("notes")
      .select("*")
      .eq("user_id", user.id)
      .order("is_pinned", { ascending: false })
      .order("updated_at", { ascending: false });

    if (dateFrom) {
      query = query.gte("created_at", dateFrom);
    }
    if (dateTo) {
      query = query.lte("created_at", `${dateTo}T23:59:59`);
    }
    if (pinnedOnly) {
      query = query.eq("is_pinned", true);
    }

    const { data: notesData, error } = await query;

    if (error) {
      toast.error("Failed to fetch notes");
      setLoading(false);
      return;
    }

    const allNotes = notesData || [];

    // Fetch tags for all notes
    let notesWithTags: NoteWithTags[] = allNotes.map((n) => ({
      ...n,
      tags: [],
    }));

    if (allNotes.length > 0) {
      const noteIds = allNotes.map((n) => n.id);
      const { data: noteTagLinks } = await supabase
        .from("note_tags")
        .select("note_id, tag_id")
        .in("note_id", noteIds);

      const { data: allTags } = await supabase
        .from("tags")
        .select("*")
        .eq("user_id", user.id);

      const tagMap = new Map((allTags || []).map((t) => [t.id, t]));

      notesWithTags = allNotes.map((note) => ({
        ...note,
        tags: (noteTagLinks || [])
          .filter((nt) => nt.note_id === note.id)
          .map((nt) => tagMap.get(nt.tag_id))
          .filter(Boolean) as NoteWithTags["tags"],
      }));
    }

    // If tag filter, filter client-side
    if (selectedTagId) {
      notesWithTags = notesWithTags.filter((n) =>
        n.tags.some((t) => t.id === selectedTagId)
      );
    }

    setNotes(notesWithTags);
    setLoading(false);
  }, [user, dateFrom, dateTo, pinnedOnly, selectedTagId]);

  useEffect(() => {
    if (user) fetchNotes();
  }, [user, fetchNotes]);

  // Client-side search filter
  const filteredNotes = notes.filter((note) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      note.title.toLowerCase().includes(q) ||
      stripHtml(note.content || "").toLowerCase().includes(q) ||
      note.tags.some((t) => t.name.toLowerCase().includes(q))
    );
  });

  async function createNote() {
    setCreating(true);
    const { data, error } = await supabase
      .from("notes")
      .insert({
        user_id: user!.id,
        title: "Untitled Note",
        content: "",
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create note");
      setCreating(false);
    } else {
      router.push(`/dashboard/notes/${data.id}`);
    }
  }

  async function deleteNote(e: React.MouseEvent, noteId: string) {
    e.preventDefault();
    e.stopPropagation();

    const { error } = await supabase.from("notes").delete().eq("id", noteId);
    if (error) {
      toast.error("Failed to delete note");
    } else {
      setNotes(notes.filter((n) => n.id !== noteId));
      toast.success("Note deleted");
    }
  }

  async function togglePin(e: React.MouseEvent, noteId: string, currentPinned: boolean) {
    e.preventDefault();
    e.stopPropagation();

    const { error } = await supabase
      .from("notes")
      .update({ is_pinned: !currentPinned })
      .eq("id", noteId);

    if (error) {
      toast.error("Failed to update pin status");
    } else {
      setNotes(
        notes
          .map((n) =>
            n.id === noteId ? { ...n, is_pinned: !currentPinned } : n
          )
          .sort((a, b) => {
            if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
            return (
              new Date(b.updated_at).getTime() -
              new Date(a.updated_at).getTime()
            );
          })
      );
      toast.success(currentPinned ? "Note unpinned" : "Note pinned");
    }
  }

  function clearFilters() {
    setSearchQuery("");
    setSelectedTagId(null);
    setDateFrom("");
    setDateTo("");
    setPinnedOnly(false);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-full max-w-sm" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-500" />
            Notes
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {notes.length} {notes.length === 1 ? "note" : "notes"} total
            {filteredNotes.length !== notes.length &&
              ` · ${filteredNotes.length} shown`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TagManager
            onTagsChange={() => {
              setTagsRefreshKey((k) => k + 1);
              fetchNotes();
            }}
          />
          <Button
            onClick={createNote}
            disabled={creating}
            className="cursor-pointer"
            id="create-note-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            {creating ? "Creating..." : "New Note"}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <NoteFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedTagId={selectedTagId}
        onTagFilter={(tagId) => setSelectedTagId(tagId)}
        dateFrom={dateFrom}
        onDateFromChange={setDateFrom}
        dateTo={dateTo}
        onDateToChange={setDateTo}
        pinnedOnly={pinnedOnly}
        onPinnedToggle={setPinnedOnly}
        onClearFilters={clearFilters}
        tagsRefreshKey={tagsRefreshKey}
      />

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16"
        >
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
          <h3 className="text-lg font-semibold">
            {searchQuery || selectedTagId || dateFrom || dateTo || pinnedOnly
              ? "No notes found"
              : "No notes yet"}
          </h3>
          <p className="text-muted-foreground text-sm mt-1">
            {searchQuery || selectedTagId || dateFrom || dateTo || pinnedOnly
              ? "Try adjusting your filters"
              : "Create your first note to get started"}
          </p>
          {!searchQuery &&
            !selectedTagId &&
            !dateFrom &&
            !dateTo &&
            !pinnedOnly && (
              <Button onClick={createNote} className="mt-4 cursor-pointer">
                <Plus className="w-4 h-4 mr-2" />
                Create Note
              </Button>
            )}
        </motion.div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <AnimatePresence>
            {filteredNotes.map((note) => (
              <motion.div
                key={note.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ y: -2 }}
              >
                <Link href={`/dashboard/notes/${note.id}`}>
                  <Card
                    className={`cursor-pointer hover:shadow-[0_10px_40px_-10px_rgba(255,255,255,0.1)] transition-all duration-300 h-full py-0 bg-white/5 backdrop-blur-xl border-white/10 hover:border-white/30 hover:bg-white/10 ${
                      note.is_pinned
                        ? "border-primary/50 relative overflow-hidden"
                        : ""
                    }`}
                  >
                    {note.is_pinned && <div className="absolute top-0 right-0 w-16 h-16 bg-primary/20 blur-xl pointer-events-none rounded-full translate-x-1/2 -translate-y-1/2" />}
                    <CardContent className="p-5 relative z-10">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-1.5 flex-1 mr-2 min-w-0">
                          {note.is_pinned && (
                            <Pin className="w-4 h-4 text-primary fill-primary flex-shrink-0 drop-shadow-md" />
                          )}
                          <h3 className="font-medium text-[15px] truncate text-white/90">
                            {note.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-7 w-7 cursor-pointer ${
                              note.is_pinned
                                ? "text-primary"
                                : "text-muted-foreground hover:text-primary"
                            }`}
                            onClick={(e) => togglePin(e, note.id, note.is_pinned)}
                            title={note.is_pinned ? "Unpin" : "Pin"}
                          >
                            <Pin
                              className={`w-3.5 h-3.5 ${
                                note.is_pinned ? "fill-current" : ""
                              }`}
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive cursor-pointer"
                            onClick={(e) => deleteNote(e, note.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-3 min-h-[3rem]">
                        {truncateText(
                          stripHtml(note.content || "Empty note"),
                          120
                        )}
                      </p>

                      {/* Tags */}
                      {note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {note.tags.slice(0, 3).map((tag) => (
                            <TagBadge key={tag.id} tag={tag} size="sm" />
                          ))}
                          {note.tags.length > 3 && (
                            <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded-full bg-muted">
                              +{note.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border/50">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(note.updated_at)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
