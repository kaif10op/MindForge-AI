import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { noteSchema } from "@/lib/validators/schemas";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const tagId = searchParams.get("tag");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const pinnedOnly = searchParams.get("pinned") === "true";

    let query = supabase
      .from("notes")
      .select("*")
      .eq("user_id", user.id);

    // Search filter - title or content
    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    // Date range filters
    if (dateFrom) {
      query = query.gte("created_at", dateFrom);
    }
    if (dateTo) {
      query = query.lte("created_at", dateTo);
    }

    // Pinned filter
    if (pinnedOnly) {
      query = query.eq("is_pinned", true);
    }

    // Order: pinned first, then by updated_at
    query = query
      .order("is_pinned", { ascending: false })
      .order("updated_at", { ascending: false });

    const { data: notes, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If tag filter is active, get note IDs that have this tag
    if (tagId && notes) {
      const { data: noteTagLinks } = await supabase
        .from("note_tags")
        .select("note_id")
        .eq("tag_id", tagId);

      const taggedNoteIds = new Set(
        (noteTagLinks || []).map((nt) => nt.note_id)
      );

      const filtered = notes.filter((n) => taggedNoteIds.has(n.id));

      // Now fetch tags for these notes
      const noteIds = filtered.map((n) => n.id);
      const { data: allNoteTags } = await supabase
        .from("note_tags")
        .select("note_id, tag_id")
        .in("note_id", noteIds.length > 0 ? noteIds : ["00000000-0000-0000-0000-000000000000"]);

      const { data: allTags } = await supabase
        .from("tags")
        .select("*")
        .eq("user_id", user.id);

      const tagMap = new Map((allTags || []).map((t) => [t.id, t]));

      const notesWithTags = filtered.map((note) => ({
        ...note,
        tags: (allNoteTags || [])
          .filter((nt) => nt.note_id === note.id)
          .map((nt) => tagMap.get(nt.tag_id))
          .filter(Boolean),
      }));

      return NextResponse.json(notesWithTags);
    }

    // Fetch tags for all notes
    if (notes && notes.length > 0) {
      const noteIds = notes.map((n) => n.id);
      const { data: allNoteTags } = await supabase
        .from("note_tags")
        .select("note_id, tag_id")
        .in("note_id", noteIds);

      const { data: allTags } = await supabase
        .from("tags")
        .select("*")
        .eq("user_id", user.id);

      const tagMap = new Map((allTags || []).map((t) => [t.id, t]));

      const notesWithTags = notes.map((note) => ({
        ...note,
        tags: (allNoteTags || [])
          .filter((nt) => nt.note_id === note.id)
          .map((nt) => tagMap.get(nt.tag_id))
          .filter(Boolean),
      }));

      return NextResponse.json(notesWithTags);
    }

    return NextResponse.json(notes || []);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = noteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { tag_ids, ...noteData } = parsed.data;

    const { data, error } = await supabase
      .from("notes")
      .insert({
        user_id: user.id,
        title: noteData.title,
        content: noteData.content,
        is_pinned: noteData.is_pinned,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Assign tags if provided
    if (tag_ids && tag_ids.length > 0) {
      const tagInserts = tag_ids.map((tag_id) => ({
        note_id: data.id,
        tag_id,
      }));
      await supabase.from("note_tags").insert(tagInserts);
    }

    return NextResponse.json({ ...data, tags: [] }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
