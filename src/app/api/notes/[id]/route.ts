import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { noteUpdateSchema } from "@/lib/validators/schemas";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Fetch tags for this note
    const { data: noteTags } = await supabase
      .from("note_tags")
      .select("tag_id")
      .eq("note_id", id);

    const tagIds = (noteTags || []).map((nt) => nt.tag_id);

    let tags: unknown[] = [];
    if (tagIds.length > 0) {
      const { data: tagData } = await supabase
        .from("tags")
        .select("*")
        .in("id", tagIds);
      tags = tagData || [];
    }

    return NextResponse.json({ ...data, tags });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = noteUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { tag_ids, ...updateData } = parsed.data;

    const { data, error } = await supabase
      .from("notes")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Sync tags if tag_ids provided
    if (tag_ids !== undefined) {
      // Remove all existing tag links
      await supabase.from("note_tags").delete().eq("note_id", id);

      // Insert new tag links
      if (tag_ids.length > 0) {
        const tagInserts = tag_ids.map((tag_id) => ({
          note_id: id,
          tag_id,
        }));
        await supabase.from("note_tags").insert(tagInserts);
      }
    }

    // Fetch updated tags
    const { data: noteTags } = await supabase
      .from("note_tags")
      .select("tag_id")
      .eq("note_id", id);

    const tagIdsResult = (noteTags || []).map((nt) => nt.tag_id);
    let tags: unknown[] = [];
    if (tagIdsResult.length > 0) {
      const { data: tagData } = await supabase
        .from("tags")
        .select("*")
        .in("id", tagIdsResult);
      tags = tagData || [];
    }

    return NextResponse.json({ ...data, tags });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("notes")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
